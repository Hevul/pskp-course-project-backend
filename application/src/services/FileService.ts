import IFileService from "../interfaces/IFileService";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import IFileRepository from "../../../core/src/repositories/IFileRepository";
import FileInfo from "../../../core/src/entities/FileInfo";
import MoveCollisionError from "../errors/MoveCollisionError";
import { Readable } from "stream";
import RenameCollisionError from "../errors/RenameCollisionError";
import IFileLinkRepository from "../../../core/src/repositories/IFileLinkRepository";
import CopyCollisionError from "../errors/CopyCollisionError";
import CreateCollisionError from "../errors/CreateCollisionError";

export class FileService implements IFileService {
  constructor(
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _fileRepository: IFileRepository,
    private readonly _dirInfoRepository: IDirInfoRepository,
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
          throw new MoveCollisionError();
        case "copy":
          throw new CopyCollisionError();
        case "create":
          throw new CreateCollisionError();
        case "rename":
          throw new RenameCollisionError();
      }
    }
  }

  private _getFilePath(file: FileInfo): string {
    return `/${file.storage}/${file.id}`;
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

  async move(id: string, destinationId?: string): Promise<FileInfo> {
    const file = await this._fileInfoRepository.get(id);

    if (file.parent !== destinationId) {
      await this._checkNameCollision(
        file.name,
        destinationId,
        file.storage,
        "move"
      );

      file.parent = destinationId;
      await this._fileInfoRepository.update(file);
    }

    return file;
  }

  async copy(id: string, parentId?: string): Promise<FileInfo> {
    let sourceFile = await this._fileInfoRepository.get(id);

    await this._checkNameCollision(
      sourceFile.name,
      parentId,
      sourceFile.storage,
      "copy"
    );

    const newFile = new FileInfo(
      sourceFile.name,
      new Date(),
      sourceFile.size,
      sourceFile.storage,
      parentId
    );

    const createdFile = await this._fileInfoRepository.add(newFile);

    await this._fileRepository.copy(
      this._getFilePath(sourceFile),
      this._getFilePath(createdFile)
    );

    return createdFile;
  }

  async overwrite(id: string, data: Buffer): Promise<FileInfo> {
    const file = await this._fileInfoRepository.get(id);
    file.updateAt = new Date();
    file.size = data.length;

    await this._fileInfoRepository.update(file);
    await this._fileRepository.overwrite(this._getFilePath(file), data);

    return file;
  }

  async delete(id: string): Promise<FileInfo> {
    const fileInfo = await this._fileInfoRepository.delete(id);

    await this._fileLinkRepository.deleteByFileInfoId(id);

    await this._fileRepository.rm(this._getFilePath(fileInfo));

    return fileInfo;
  }

  async download(id: string): Promise<[FileInfo, string]> {
    const fileInfo = await this._fileInfoRepository.get(id);
    const pathname = `/${fileInfo.storage}/${fileInfo.id}`;
    return [fileInfo, pathname];
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
    const createdFile = await this._fileInfoRepository.add(file);

    try {
      await this._fileRepository.saveStream(
        this._getFilePath(createdFile),
        readableStream
      );
      return createdFile;
    } catch (error) {
      await this._fileInfoRepository.delete(createdFile.id);
      console.log(error);
    }

    return createdFile;
  }
}
