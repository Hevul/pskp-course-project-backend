import IFileService from "../interfaces/IFileService";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileRepository from "../../../core/src/repositories/IFileRepository";
import FileInfo from "../../../core/src/entities/FileInfo";
import MoveCollisionError from "../errors/MoveCollisionError";
import { PassThrough, Readable } from "stream";
import RenameCollisionError from "../errors/RenameCollisionError";
import IFileLinkRepository from "../../../core/src/repositories/IFileLinkRepository";
import CopyCollisionError from "../errors/CopyCollisionError";
import CreateCollisionError from "../errors/CreateCollisionError";
import archiver from "archiver";
import { Types } from "mongoose";
import SameDestinationError from "../errors/SameDestinationError";

export class FileService implements IFileService {
  constructor(
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _fileRepository: IFileRepository,
    private readonly _fileLinkRepository: IFileLinkRepository
  ) {}

  private async _checkNameCollision(
    name: string,
    parentId: string | undefined,
    storageId: string,
    operationType: "move" | "copy" | "rename" | "create"
  ): Promise<void> {
    const existingNames = await this._fileInfoRepository.find({
      name,
      parent: parentId,
      storage: storageId,
    });

    if (existingNames.length > 0) {
      switch (operationType) {
        case "move":
          throw new MoveCollisionError(existingNames[0].id);
        case "copy":
          throw new CopyCollisionError();
        case "create":
          throw new CreateCollisionError();
        case "rename":
          throw new RenameCollisionError();
      }
    }
  }

  async checkFileExists(
    filename: string,
    storageId: string,
    parentId?: string
  ): Promise<FileInfo | null> {
    const existingFiles = await this._fileInfoRepository.find({
      name: filename,
      storage: storageId,
      parent: parentId || { $exists: false },
    });

    return existingFiles.length > 0 ? existingFiles[0] : null;
  }

  async getAllByStorageId(storageId: string): Promise<FileInfo[]> {
    return this._fileInfoRepository.find({ storage: storageId });
  }

  async get(id: string): Promise<FileInfo> {
    return this._fileInfoRepository.get(id);
  }

  async rename(id: string, name: string): Promise<FileInfo> {
    const file = await this._fileInfoRepository.get(id);

    if (file.name !== name) {
      await this._checkNameCollision(name, file.parent, file.storage, "rename");
      file.name = name;
      await this._fileInfoRepository.update(file);
    }

    return file;
  }

  async move(options: {
    id: string;
    destinationId?: string;
    newName?: string;
    overwrite?: boolean;
  }): Promise<FileInfo> {
    const { id, destinationId, newName, overwrite } = options;
    const file = await this._fileInfoRepository.get(id);

    if (file.parent === destinationId) throw new SameDestinationError();

    if (newName) file.name = newName;

    try {
      await this._checkNameCollision(
        file.name,
        destinationId,
        file.storage,
        "move"
      );
    } catch (error) {
      if (error instanceof MoveCollisionError && overwrite)
        await this.delete(error.conflictingId);
      else throw error;
    }

    file.parent = destinationId;
    await this._fileInfoRepository.update(file);

    return file;
  }

  async copy(id: string, parentId?: string): Promise<FileInfo> {
    const sourceFile = await this._fileInfoRepository.get(id);
    let newName = sourceFile.name;
    let attempt = 1;

    while (true) {
      try {
        await this._checkNameCollision(
          newName,
          parentId,
          sourceFile.storage,
          "copy"
        );
        break;
      } catch (error) {
        const extensionIndex = sourceFile.name.lastIndexOf(".");

        if (extensionIndex >= 0) {
          const baseName = sourceFile.name.substring(0, extensionIndex);
          const extension = sourceFile.name.substring(extensionIndex);

          if (attempt === 1) {
            newName = `${baseName} (${attempt})${extension}`;
          } else {
            const lastNumberPattern = / \(\d+\)$/;
            const baseWithoutNumber = baseName.replace(lastNumberPattern, "");
            newName = `${baseWithoutNumber} (${attempt})${extension}`;
          }
        } else {
          if (attempt === 1) {
            newName = `${sourceFile.name} (${attempt})`;
          } else {
            const lastNumberPattern = / \(\d+\)$/;
            const baseWithoutNumber = sourceFile.name.replace(
              lastNumberPattern,
              ""
            );
            newName = `${baseWithoutNumber} (${attempt})`;
          }
        }
        attempt++;
      }
    }

    const newFile = new FileInfo(
      newName,
      new Date(),
      sourceFile.size,
      sourceFile.storage,
      parentId,
      "",
      undefined,
      sourceFile.physicalFileId
    );

    const createdFile = await this._fileInfoRepository.add(newFile);
    return createdFile;
  }

  async overwrite(
    fileId: string,
    fileStream: Readable,
    newSize: number
  ): Promise<FileInfo> {
    const existingFile = await this._fileInfoRepository.get(fileId);
    const refCount = await this._fileInfoRepository.getRefCount(
      existingFile.physicalFileId
    );

    existingFile.updateAt = new Date();
    existingFile.size = newSize;

    if (refCount > 1) {
      existingFile.physicalFileId = new Types.ObjectId().toString();
      await this._fileRepository.saveStream(existingFile.path(), fileStream);
    } else
      await this._fileRepository.overwrite(existingFile.path(), fileStream);

    await this._fileInfoRepository.update(existingFile);

    return existingFile;
  }

  async delete(id: string): Promise<FileInfo> {
    const fileInfo = await this._fileInfoRepository.get(id);

    const refCount = await this._fileInfoRepository.getRefCount(
      fileInfo.physicalFileId
    );

    if (refCount <= 1) await this._fileRepository.rm(fileInfo.path());

    await this._fileInfoRepository.delete(id);
    await this._fileLinkRepository.deleteByFileInfoId(id);

    return fileInfo;
  }

  async download(id: string): Promise<[FileInfo, Readable]> {
    const fileInfo = await this._fileInfoRepository.get(id);
    const stream = await this._fileRepository.getStream(fileInfo.path());
    return [fileInfo, stream];
  }

  async downloadMultiple(ids: string[]): Promise<{
    archiveName: string;
    fileStream: Readable;
  }> {
    const archiveName = `files-${Date.now()}.zip`;
    const archive = archiver("zip", {
      zlib: { level: 5 },
      highWaterMark: 1024 * 1024,
    });
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    (async () => {
      for (const id of ids) {
        try {
          const file = await this._fileInfoRepository.get(id);
          const fileStream = await this._fileRepository.getStream(file.path());

          archive.append(fileStream, { name: file.name });
        } catch (err) {
          console.error("Ошибка при добавлении файла в архив", err);
        }
      }
      archive.finalize();
    })();

    archive.on("error", (err) => {
      passThrough.destroy(err);
    });

    return { archiveName, fileStream: passThrough };
  }

  async upload(
    filename: string,
    readableStream: Readable,
    storageId: string,
    size: number,
    parentId?: string
  ): Promise<FileInfo> {
    await this._checkNameCollision(filename, parentId, storageId, "create");

    const file = new FileInfo(filename, new Date(), size, storageId, parentId);
    file.physicalFileId = new Types.ObjectId().toString();
    const createdFile = await this._fileInfoRepository.add(file);

    try {
      await this._fileRepository.saveStream(createdFile.path(), readableStream);
      return createdFile;
    } catch (error) {
      await this._fileInfoRepository.delete(createdFile.id);
      console.log(error);
    }

    return createdFile;
  }
}
