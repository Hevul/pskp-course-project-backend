import DirInfo from "../../../core/src/entities/DirInfo";
import IDirService from "../interfaces/IDirService";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import DirectoryMoveInChildError from "../errors/DirectoryMoveInChildError";
import DirectoryMoveInItSelfError from "../errors/DirectoryMoveInItSelfError";
import MoveCollisionError from "../errors/MoveCollisionError";
import CopyCollisionError from "../errors/CopyCollisionError";
import { DirInfoFullInfoDTO } from "../dtos/DirInfoFullInfoDTO";
import CreateCollisionError from "../errors/CreateCollisionError";
import FileInfo from "../../../core/src/entities/FileInfo";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileRepository from "../../../core/src/repositories/IFileRepository";
import RenameCollisionError from "../errors/RenameCollisionError";
import { finished } from "stream/promises";
import { Readable, PassThrough } from "stream";
import archiver from "archiver";
import IFileLinkRepository from "../../../core/src/repositories/IFileLinkRepository";

class DirService implements IDirService {
  constructor(
    private readonly _dirInfoRepository: IDirInfoRepository,
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _fileLinkRepository: IFileLinkRepository,
    private readonly _fileRepository: IFileRepository
  ) {}

  private async _getChildrenNames(
    parentId: string | undefined,
    storageId: string,
    isDir: boolean
  ): Promise<string[]> {
    if (isDir) {
      const dirs = await this._dirInfoRepository.find({
        parent: parentId,
        storage: storageId,
      });
      return dirs.map((d) => d.name);
    } else {
      const files = await this._fileInfoRepository.find({
        parent: parentId,
        storage: storageId,
      });
      return files.map((f) => f.name);
    }
  }

  private async _checkNameCollision(
    name: string,
    parentId: string | undefined,
    storageId: string,
    operationType: "create" | "move" | "copy" | "rename" = "create"
  ): Promise<void> {
    const [existingDirs, existingFiles] = await Promise.all([
      this._getChildrenNames(parentId, storageId, true),
      this._getChildrenNames(parentId, storageId, false),
    ]);

    if (existingDirs.includes(name) || existingFiles.includes(name)) {
      switch (operationType) {
        case "move":
          throw new MoveCollisionError("");
        case "copy":
          throw new CopyCollisionError();
        case "rename":
          throw new RenameCollisionError();
        case "create":
        default:
          throw new CreateCollisionError();
      }
    }
  }

  async getFullInfo(id: string): Promise<DirInfoFullInfoDTO> {
    const dirInfo = await this._dirInfoRepository.get(id);

    const [counts, size, path] = await Promise.all([
      this._dirInfoRepository.getRecursiveCounts(id),
      this._dirInfoRepository.getSize(id),
      this._dirInfoRepository.getPath(id),
    ]);

    const cleanPath = path.replace(/^\/[a-f0-9]+/, "");

    return {
      name: dirInfo.name,
      createAt: dirInfo.uploadAt,
      fileCount: counts.fileCount,
      dirCount: counts.dirCount,
      size: size,
      path: cleanPath,
    };
  }

  async getAllByStorageId(storageId: string): Promise<DirInfo[]> {
    return this._dirInfoRepository.find({ storage: storageId });
  }

  async move(options: {
    id: string;
    destinationId?: string;
    newName?: string;
    overwrite?: boolean;
  }): Promise<DirInfo> {
    const { id, destinationId, newName, overwrite } = options;

    let movedDir = await this._dirInfoRepository.get(id);

    if (id === destinationId) throw new DirectoryMoveInItSelfError();

    if (destinationId) {
      const destinationPath = await this._dirInfoRepository.getPath(
        destinationId
      );
      const currentPath = await this._dirInfoRepository.getPath(id);
      if (destinationPath.startsWith(`${currentPath}/`))
        throw new DirectoryMoveInChildError();
    }

    if (newName) movedDir.name = newName;

    try {
      await this._checkNameCollision(
        movedDir.name,
        destinationId,
        movedDir.storage,
        "move"
      );
    } catch (error) {
      if (error instanceof MoveCollisionError) {
        const [conflictingDir] = await this._dirInfoRepository.find({
          name: movedDir.name,
          parent: destinationId,
          storage: movedDir.storage,
        });

        if (overwrite) {
          const originalName = movedDir.name;

          movedDir.name = `temp_${Date.now()}_${movedDir.name}`;
          movedDir.parent = undefined;
          const tempDir = await this._dirInfoRepository.update(movedDir);

          await this.delete(conflictingDir.id);

          tempDir.name = originalName;
          tempDir.parent = destinationId;
          return this._dirInfoRepository.update(tempDir);
        } else throw new MoveCollisionError(conflictingDir.id);
      }
      throw error;
    }

    movedDir.parent = destinationId;
    return this._dirInfoRepository.update(movedDir);
  }

  async copy(id: string, destinationId?: string): Promise<DirInfo> {
    const sourceDir = await this._dirInfoRepository.get(id);

    if (id === destinationId) throw new DirectoryMoveInItSelfError();

    try {
      await this._checkNameCollision(
        sourceDir.name,
        destinationId,
        sourceDir.storage,
        "copy"
      );
    } catch (error) {
      if (error instanceof CopyCollisionError) {
        let newName = sourceDir.name;
        let counter = 1;
        let nameExists = true;

        while (nameExists) {
          try {
            newName = `${sourceDir.name}(${counter})`;
            await this._checkNameCollision(
              newName,
              destinationId,
              sourceDir.storage,
              "copy"
            );
            nameExists = false;
          } catch (e) {
            if (!(e instanceof CopyCollisionError)) throw e;
            counter++;
          }
        }

        const newDir = new DirInfo(
          newName,
          new Date(),
          sourceDir.storage,
          destinationId
        );

        const createdDir = await this._dirInfoRepository.add(newDir);
        await this._copyDirectoryContents(id, createdDir.id);
        return createdDir;
      }
      throw error;
    }

    const newDir = new DirInfo(
      sourceDir.name,
      new Date(),
      sourceDir.storage,
      destinationId
    );

    const createdDir = await this._dirInfoRepository.add(newDir);
    await this._copyDirectoryContents(id, createdDir.id);
    return createdDir;
  }

  private async _copyDirectoryContents(
    sourceDirId: string,
    targetDirId: string
  ): Promise<void> {
    const [files, subDirs] = await Promise.all([
      this._fileInfoRepository.find({ parent: sourceDirId }),
      this._dirInfoRepository.find({ parent: sourceDirId }),
    ]);

    await Promise.all(
      files.map(async (file) => {
        const newFile = new FileInfo(
          file.name,
          new Date(),
          file.size,
          file.storage,
          targetDirId,
          "",
          undefined,
          file.physicalFileId
        );
        await this._fileInfoRepository.add(newFile);
      })
    );

    await Promise.all(
      subDirs.map(async (dir) => {
        const newSubDir = new DirInfo(
          dir.name,
          new Date(),
          dir.storage,
          targetDirId
        );
        const createdSubDir = await this._dirInfoRepository.add(newSubDir);
        await this._copyDirectoryContents(dir.id, createdSubDir.id);
      })
    );
  }

  async getSize(id: string): Promise<number> {
    return this._dirInfoRepository.getSize(id);
  }

  async rename(id: string, name: string): Promise<DirInfo> {
    const dir = await this._dirInfoRepository.get(id);

    await this._checkNameCollision(name, dir.parent, dir.storage, "rename");

    dir.name = name;
    return await this._dirInfoRepository.update(dir);
  }

  async delete(id: string): Promise<DirInfo> {
    const dirInfo = await this._dirInfoRepository.get(id);

    await this._deleteDirectoryContents(id);
    await this._dirInfoRepository.delete(id);

    return dirInfo;
  }

  private async _deleteDirectoryContents(dirId: string): Promise<void> {
    const [files, subDirs] = await Promise.all([
      this._fileInfoRepository.find({ parent: dirId }),
      this._dirInfoRepository.find({ parent: dirId }),
    ]);

    await Promise.all(
      files.map(async (file) => {
        try {
          const refCount = await this._fileInfoRepository.getRefCount(
            file.physicalFileId
          );

          if (refCount <= 1) await this._fileRepository.rm(file.path());

          await this._fileInfoRepository.delete(file.id);
          await this._fileLinkRepository.deleteByFileInfoId(file.id);
        } catch (error) {
          console.error(`Failed to delete file ${file.id}:`, error);
        }
      })
    );

    await Promise.all(
      subDirs.map(async (dir) => {
        try {
          await this._deleteDirectoryContents(dir.id);
          await this._dirInfoRepository.delete(dir.id);
        } catch (error) {
          console.error(`Failed to delete subdirectory ${dir.id}:`, error);
        }
      })
    );
  }

  async create(
    name: string,
    storageId: string,
    parentId?: string
  ): Promise<DirInfo> {
    await this._checkNameCollision(name, parentId, storageId, "create");

    const dir = new DirInfo(name, new Date(), storageId, parentId);
    return this._dirInfoRepository.add(dir);
  }

  async download(dirId: string): Promise<{
    fileStream: Readable;
    archiveName: string;
  }> {
    const dir = await this._dirInfoRepository.get(dirId);
    const archiveName = `${dir.name}.zip`;
    const archive = archiver("zip", {
      zlib: { level: 5 },
    });
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    await this._addDirectoryToArchive(dirId, archive, "");

    archive.finalize();

    return {
      archiveName,
      fileStream: passThrough,
    };
  }

  private async _addDirectoryToArchive(
    dirId: string,
    archive: archiver.Archiver,
    currentPath: string
  ): Promise<void> {
    const files = await this._fileInfoRepository.find({ parent: dirId });
    await Promise.all(
      files.map(async (file) => {
        const fileStream = await this._fileRepository.getStream(file.path());
        archive.append(fileStream, { name: `${currentPath}${file.name}` });
      })
    );

    const subDirs = await this._dirInfoRepository.find({ parent: dirId });
    await Promise.all(
      subDirs.map(async (dir) => {
        archive.append("", { name: `${currentPath}${dir.name}/` });
        await this._addDirectoryToArchive(
          dir.id,
          archive,
          `${currentPath}${dir.name}/`
        );
      })
    );
  }

  async downloadMultiple(ids: string[]): Promise<{
    archiveName: string;
    fileStream: Readable;
  }> {
    const archiveName = `directories-${Date.now()}.zip`;
    const archive = archiver("zip", {
      zlib: { level: 5 },
    });
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    await Promise.all(
      ids.map(async (id) => {
        const dir = await this._dirInfoRepository.get(id);
        await this._addDirectoryToArchive(id, archive, `${dir.name}/`);
      })
    );

    archive.finalize();

    return {
      archiveName,
      fileStream: passThrough,
    };
  }
}

export default DirService;
