import IFileService from "../interfaces/IFileService";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import IFileRepository from "../../../core/src/repositories/IFileRepository";
import FileInfo from "../../../core/src/entities/FileInfo";
import MoveCollisionError from "../errors/MoveCollisionError";
import { Readable } from "stream";
import RenameCollisionError from "../errors/RenameCollisionError";
import IFileLinkRepository from "../../../core/src/repositories/IFileLinkRepository";

export class FileService implements IFileService {
  constructor(
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _fileRepository: IFileRepository,
    private readonly _dirInfoRepository: IDirInfoRepository,
    private readonly _fileLinkRepository: IFileLinkRepository
  ) {}

  async getAllByStorageId(id: string): Promise<FileInfo[]> {
    const fileInfos = await this._fileInfoRepository.getAll();

    return fileInfos.filter((f) => f.storage === id);
  }

  async get(id: string): Promise<FileInfo> {
    return this._fileInfoRepository.get(id);
  }

  async rename(id: string, name: string): Promise<FileInfo> {
    let file = await this._fileInfoRepository.get(id);

    if (file.parent) {
      const parent = await this._dirInfoRepository.get(file.parent);

      for (let childId of parent.files) {
        const child = await this._fileInfoRepository.get(childId);
        if (child.name === name) throw new RenameCollisionError();
      }
    } else {
      let rootChild = await this._fileInfoRepository.getAll();
      rootChild = rootChild.filter(
        (f) => f.storage === file.storage && !f.parent
      );

      for (let child of rootChild) {
        if (child.name === name) throw new RenameCollisionError();
      }
    }

    const oldPathname = await this._fileInfoRepository.getPathname(id);

    file.name = name;

    await this._fileInfoRepository.update(file);

    const newPathname = await this._fileInfoRepository.getPathname(id);

    await this._fileRepository.move(oldPathname, newPathname);

    return file;
  }

  async move(id: string, destinationId?: string): Promise<FileInfo> {
    let file = await this._fileInfoRepository.get(id);

    if (destinationId) {
      const parent = await this._dirInfoRepository.get(destinationId);

      for (let childId of parent.files) {
        const child = await this._fileInfoRepository.get(childId);
        if (child.name === file.name) throw new MoveCollisionError();
      }
    } else {
      let rootChild = await this._fileInfoRepository.getAll();
      rootChild = rootChild.filter(
        (f) => f.storage === file.storage && !f.parent
      );

      for (let child of rootChild)
        if (child.name === file.name) throw new MoveCollisionError();
    }

    const oldPathname = await this._fileInfoRepository.getPathname(file.id);

    if (file.parent) {
      const parent = await this._dirInfoRepository.get(file.parent);

      parent.removeFile(file.id);

      await this._dirInfoRepository.update(parent);
    }

    if (destinationId) {
      const destination = await this._dirInfoRepository.get(destinationId);

      file.parent = destinationId;

      destination.addFile(file.id);

      await this._dirInfoRepository.update(destination);
    } else {
      file.parent = undefined;
    }

    await this._fileInfoRepository.update(file);

    const newPathname = await this._fileInfoRepository.getPathname(file.id);

    await this._fileRepository.move(oldPathname, newPathname);

    return file;
  }

  async copy(id: string, parentId?: string): Promise<FileInfo> {
    let sourceFile = await this._fileInfoRepository.get(id);

    if (parentId) {
      const parent = await this._dirInfoRepository.get(parentId);

      for (let childId of parent.files) {
        const child = await this._fileInfoRepository.get(childId);
        if (child.name === sourceFile.name) throw new MoveCollisionError();
      }
    } else {
      let rootChild = await this._fileInfoRepository.getAll();
      rootChild = rootChild.filter(
        (f) => f.storage === sourceFile.storage && !f.parent
      );

      for (let child of rootChild)
        if (child.name === sourceFile.name) throw new MoveCollisionError();
    }

    let newFile = new FileInfo(
      sourceFile.name,
      new Date(),
      sourceFile.size,
      sourceFile.storage,
      parentId
    );

    newFile = await this._fileInfoRepository.add(newFile);

    let pathname = `/${sourceFile.storage}/${newFile.name}`;

    if (parentId) {
      const parentDir = await this._dirInfoRepository.get(parentId);

      parentDir.addFile(newFile.id);

      await this._dirInfoRepository.update(parentDir);

      const parentPath = await this._dirInfoRepository.getPath(parentDir.id);

      pathname = `/${parentPath}/${newFile.name}`;
    }

    const sourceFilePathname = await this._fileInfoRepository.getPathname(
      sourceFile.id
    );

    await this._fileRepository.copy(sourceFilePathname, pathname);

    return newFile;
  }

  async overwrite(id: string, data: Buffer): Promise<FileInfo> {
    const file = await this._fileInfoRepository.get(id);

    file.updateAt = new Date();
    file.size = data.length;

    const pathname = await this._fileInfoRepository.getPathname(file.id);

    await this._fileInfoRepository.update(file);

    await this._fileRepository.overwrite(pathname, data);

    return file;
  }

  async delete(id: string): Promise<FileInfo> {
    const pathname = await this._fileInfoRepository.getPathname(id);

    const fileInfo = await this._fileInfoRepository.delete(id);
    await this._fileLinkRepository.deleteByFileInfoId(id);

    if (fileInfo.parent) {
      const dirInfo = await this._dirInfoRepository.get(fileInfo.parent);

      dirInfo.removeFile(fileInfo.id);

      await this._dirInfoRepository.update(dirInfo);
    }

    await this._fileRepository.rm(pathname);

    return fileInfo;
  }

  async download(id: string): Promise<[FileInfo, string]> {
    const fileInfo = await this._fileInfoRepository.get(id);

    const pathname = await this._fileInfoRepository.getPathname(fileInfo.id);

    return [fileInfo, pathname];
  }

  async upload(
    filename: string,
    readableStream: Readable,
    storageId: string,
    size: number,
    parentId?: string
  ): Promise<FileInfo> {
    let file = new FileInfo(filename, new Date(), size, storageId, parentId);

    file = await this._fileInfoRepository.add(file);

    if (parentId) {
      const parent = await this._dirInfoRepository.get(parentId);

      parent.addFile(file.id);

      await this._dirInfoRepository.update(parent);
    }

    const path = await this._fileInfoRepository.getPathname(file.id);

    await this._fileRepository.saveStream(path, readableStream);

    return file;
  }
}
