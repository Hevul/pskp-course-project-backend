import FileInfo from "../../../../../core/src/entities/FileInfo";
import IFileInfoRepository from "../../../../../core/src/repositories/IFileInfoRepository";
import FileInfoNotFoundError from "./errors/FileInfoNotFoundError";
import FileInfoDb from "../fileInfo/FileInfoDb";
import FileInfoAlreadyExistsError from "./errors/FileInfoAlreadyExistsError";
import DirInfoDb from "../dirInfo/DirInfoDb";
import DirInfoNotFoundError from "../dirInfo/errors/DirInfoNotFoundError";
import { Types } from "mongoose";

class FileInfoRepository implements IFileInfoRepository {
  async count(query: { [key: string]: any }): Promise<number> {
    const processedQuery = this._processQuery(query);
    return FileInfoDb.countDocuments(processedQuery).exec();
  }

  async exists(id: string): Promise<boolean> {
    try {
      return (await FileInfoDb.exists({ _id: id })) !== null;
    } catch {
      return false;
    }
  }

  async getPathname(id: string): Promise<string> {
    let fileInfo: any;

    try {
      fileInfo = await FileInfoDb.findById(id).populate("parent").exec();
    } catch {
      throw new FileInfoNotFoundError();
    }

    if (!fileInfo) throw new FileInfoNotFoundError();

    if (!fileInfo.parent) return `/${fileInfo.storage}/${fileInfo.name}`;

    const parentPath = await this.getDirPath(fileInfo.parent._id.toString());

    return `${parentPath}/${fileInfo.name}`;
  }

  private async getDirPath(id: string): Promise<string> {
    let dirInfo: any;

    try {
      dirInfo = await DirInfoDb.findById(id).populate("parent").exec();
    } catch {
      throw new DirInfoNotFoundError();
    }

    if (!dirInfo) throw new DirInfoNotFoundError();

    if (!dirInfo.parent) return `/${dirInfo.storage}/${dirInfo.name}`;

    const parentPath = await this.getDirPath(dirInfo.parent._id.toString());

    return `${parentPath}/${dirInfo.name}`;
  }

  async update(fileInfo: FileInfo): Promise<FileInfo> {
    const { id, name, updateAt, size, parent } = fileInfo;

    const updatedData = {
      name,
      updateAt,
      size,
      parent,
    };

    try {
      if (!parent) {
        await FileInfoDb.updateOne(
          { _id: id },
          { $set: updatedData, $unset: { parent: "" } }
        );
      } else {
        await FileInfoDb.updateOne({ _id: id }, { $set: updatedData });
      }
    } catch (error: any) {
      throw new FileInfoNotFoundError();
    }

    return this.get(id);
  }

  async getAll(): Promise<FileInfo[]> {
    const fileInfosDb = await FileInfoDb.find();

    const fileInfos = await Promise.all(
      fileInfosDb.map((f) => this._mapToFileInfo(f))
    );

    return fileInfos;
  }

  async get(id: string): Promise<FileInfo> {
    try {
      const fileInfoDb = await FileInfoDb.findById(id);

      if (!fileInfoDb) throw new FileInfoNotFoundError();

      return this._mapToFileInfo(fileInfoDb);
    } catch {
      throw new FileInfoNotFoundError();
    }
  }

  async add(fileInfo: FileInfo): Promise<FileInfo> {
    const { name, uploadAt, size, storage: storageId, parent } = fileInfo;

    try {
      const fileInfoDb = await FileInfoDb.create({
        name: name,
        uploadAt,
        size,
        storage: storageId,
        parent,
      });

      return this._mapToFileInfo(fileInfoDb);
    } catch (error: any) {
      if (error.code === 11000) throw new FileInfoAlreadyExistsError();
      throw error;
    }
  }

  async delete(id: string): Promise<FileInfo> {
    let fileInfoDb: any;

    try {
      fileInfoDb = await FileInfoDb.findById(id);
    } catch {
      throw new FileInfoNotFoundError();
    }

    if (!fileInfoDb) throw new FileInfoNotFoundError();

    await FileInfoDb.deleteOne({ _id: fileInfoDb._id });

    return this._mapToFileInfo(fileInfoDb);
  }

  async find(query: { [key: string]: any }): Promise<FileInfo[]> {
    const processedQuery = this._processQuery(query);

    const fileDocs = await FileInfoDb.find(processedQuery).lean().exec();

    return fileDocs.map((fileDoc) => this._mapToFileInfo(fileDoc));
  }

  private _processQuery(query: { [key: string]: any }): { [key: string]: any } {
    const processed = { ...query };

    if (processed.parent) processed.parent = this._toObjectId(processed.parent);

    if (processed.storage)
      processed.storage = this._toObjectId(processed.storage);

    if (processed._id) processed._id = this._toObjectId(processed._id);

    return processed;
  }

  private _toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === "string" ? new Types.ObjectId(id) : id;
  }

  private _mapToFileInfo(fileDoc: any): FileInfo {
    return new FileInfo(
      fileDoc.name,
      fileDoc.uploadAt,
      fileDoc.size,
      fileDoc.storage.toString(),
      fileDoc.parent?.toString(),
      fileDoc._id.toString()
    );
  }
}

export default FileInfoRepository;
