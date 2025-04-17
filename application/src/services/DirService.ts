import DirInfo from "../../../core/src/entities/DirInfo";
import IDirService from "../interfaces/IDirService";
import IDirRepository from "../../../core/src/repositories/IDirRepository";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import DirectoryNotEmptyError from "../errors/DirectoryNotEmptyError";
import DirectoryMoveInChildError from "../errors/DirectoryMoveInChildError";
import DirectoryMoveInItSelfError from "../errors/DirectoryMoveInItSelfError";
import MoveCollisionError from "../errors/MoveCollisionError";
import CopyCollisionError from "../errors/CopyCollisionError";
import { DirInfoFullInfoDTO } from "../dtos/DirInfoFullInfoDTO";

class DirService implements IDirService {
  constructor(
    private readonly _dirRepository: IDirRepository,
    private readonly _dirInfoRepository: IDirInfoRepository
  ) {}

  async getFullInfo(id: string): Promise<DirInfoFullInfoDTO> {
    const dirInfo = await this._dirInfoRepository.get(id);

    const currentDirSize = await this._dirInfoRepository.getSize(id);

    const fileCount = dirInfo.files.length;
    const dirCount = dirInfo.subdirectories.length;

    const subdirsInfo = await Promise.all(
      dirInfo.subdirectories.map((subdirId) =>
        this._dirInfoRepository.get(subdirId)
      )
    );

    const totalFileCount = subdirsInfo.reduce(
      (sum, info) => sum + info.files.length,
      fileCount
    );

    const totalDirCount = subdirsInfo.reduce(
      (sum, info) => sum + info.subdirectories.length,
      dirCount
    );

    const path = await this._dirInfoRepository.getPath(id);

    const cleanPath = path.replace(/^\/[a-f0-9]+/, "");

    return {
      name: dirInfo.name,
      createAt: dirInfo.uploadAt,
      fileCount: totalFileCount,
      dirCount: totalDirCount,
      size: currentDirSize,
      path: cleanPath,
    };
  }

  async getAllByStorageId(storageId: string): Promise<DirInfo[]> {
    const dirInfos = await this._dirInfoRepository.getAll();

    return dirInfos.filter((d) => d.storage === storageId);
  }

  async move(id: string, destinationId?: string): Promise<DirInfo> {
    let movedDir = await this._dirInfoRepository.get(id);

    if (id === destinationId) throw new DirectoryMoveInItSelfError();

    if (destinationId) {
      const destination = await this._dirInfoRepository.get(destinationId);

      for (let subId of destination.subdirectories) {
        const sub = await this._dirInfoRepository.get(subId);
        if (sub.name === movedDir.name) throw new MoveCollisionError();
      }
    } else {
      let rootDirs = await this._dirInfoRepository.getAll();
      rootDirs = rootDirs.filter(
        (d) => d.storage === movedDir.storage && !d.parent
      );

      for (let dir of rootDirs)
        if (dir.name === movedDir.name) throw new MoveCollisionError();
    }

    const oldPath = await this._dirInfoRepository.getPath(movedDir.id);

    if (destinationId) {
      const destinationPath = await this._dirInfoRepository.getPath(
        destinationId
      );

      if (destinationPath.startsWith(`${oldPath}/`))
        throw new DirectoryMoveInChildError();
    }

    if (movedDir.parent) {
      const parent = await this._dirInfoRepository.get(movedDir.parent);

      console.log(parent);

      parent.removeSubdirectory(id);

      await this._dirInfoRepository.update(parent);
    }

    movedDir.parent = destinationId;

    movedDir = await this._dirInfoRepository.update(movedDir);

    if (destinationId) {
      const destination = await this._dirInfoRepository.get(destinationId);

      destination.addSubdirectory(movedDir.id);

      await this._dirInfoRepository.update(destination);
    }

    const newPath = await this._dirInfoRepository.getPath(movedDir.id);

    await this._dirRepository.copy(oldPath, newPath);
    await this._dirRepository.rm(oldPath);

    return movedDir;
  }

  async copy(id: string, destinationId?: string): Promise<DirInfo> {
    const sourceDir = await this._dirInfoRepository.get(id);

    if (destinationId) {
      const destination = await this._dirInfoRepository.get(destinationId);

      for (let subId of destination.subdirectories) {
        const sub = await this._dirInfoRepository.get(subId);
        if (sub.name === sourceDir.name) throw new CopyCollisionError();
      }
    } else {
      let rootDirs = await this._dirInfoRepository.getAll();
      rootDirs = rootDirs.filter(
        (d) => d.storage === sourceDir.storage && !d.parent
      );

      for (let dir of rootDirs)
        if (dir.name === sourceDir.name) throw new CopyCollisionError();
    }

    const oldPath = await this._dirInfoRepository.getPath(sourceDir.id);

    let copiedDir = new DirInfo(
      sourceDir.name,
      new Date(),
      sourceDir.storage,
      destinationId
    );

    copiedDir = await this._dirInfoRepository.add(copiedDir);

    if (destinationId) {
      const destination = await this._dirInfoRepository.get(destinationId);

      destination.addSubdirectory(copiedDir.id);

      await this._dirInfoRepository.update(destination);
    }

    const newPath = await this._dirInfoRepository.getPath(copiedDir.id);

    await this._dirRepository.copy(oldPath, newPath);

    return copiedDir;
  }

  async getSize(id: string): Promise<number> {
    return this._dirInfoRepository.getSize(id);
  }

  async rename(id: string, name: string): Promise<DirInfo> {
    let dir = await this._dirInfoRepository.get(id);

    dir.name = name;

    const oldPath = await this._dirInfoRepository.getPath(dir.id);

    dir = await this._dirInfoRepository.update(dir);

    const newPath = await this._dirInfoRepository.getPath(dir.id);

    await this._dirRepository.copy(oldPath, newPath);
    await this._dirRepository.rm(oldPath);

    return dir;
  }

  async delete(id: string, force: boolean = false): Promise<DirInfo> {
    const dirInfo = await this._dirInfoRepository.get(id);

    if (!force) {
      if (dirInfo.files.length !== 0) throw new DirectoryNotEmptyError();
      if (dirInfo.subdirectories.length !== 0)
        throw new DirectoryNotEmptyError();
    }

    const path = await this._dirInfoRepository.getPath(id);

    if (dirInfo.parent) {
      const parent = await this._dirInfoRepository.get(dirInfo.parent);

      parent.removeSubdirectory(dirInfo.id);

      console.log(parent.subdirectories);

      await this._dirInfoRepository.update(parent);
    }

    await this._dirInfoRepository.delete(id, force);

    await this._dirRepository.rm(path);

    return dirInfo;
  }

  async create(
    name: string,
    storageId: string,
    parentId?: string
  ): Promise<DirInfo> {
    let dir = new DirInfo(name, new Date(), storageId, parentId);

    dir = await this._dirInfoRepository.add(dir);

    if (parentId) {
      const parentDir = await this._dirInfoRepository.get(parentId);

      parentDir.addSubdirectory(dir.id);

      await this._dirInfoRepository.update(parentDir);
    }

    const path = await this._dirInfoRepository.getPath(dir.id);

    await this._dirRepository.mkdir(path);

    return dir;
  }
}

export default DirService;
