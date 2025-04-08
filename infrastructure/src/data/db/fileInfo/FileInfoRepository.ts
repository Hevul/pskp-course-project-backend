import FileInfo from "../../../../../core/src/entities/FileInfo";
import IFileInfoRepository from "../../../../../core/src/repositories/IFileInfoRepository";
import FileInfoNotFoundError from "./errors/FileInfoNotFoundError";
import FileInfoDb from "../fileInfo/FileInfoDb";
import FileInfoAlreadyExistsError from "./errors/FileInfoAlreadyExistsError";
import DirInfoDb from "../dirInfo/DirInfoDb";
import DirInfoNotFoundError from "../dirInfo/errors/DirInfoNotFoundError";

class FileInfoRepository implements IFileInfoRepository {
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
      fileInfosDb.map(async (f) => await map(f))
    );

    return fileInfos;
  }

  async get(id: string): Promise<FileInfo> {
    try {
      const fileInfoDb = await FileInfoDb.findById(id);

      if (!fileInfoDb) throw new FileInfoNotFoundError();

      return map(fileInfoDb);
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

      return map(fileInfoDb);
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

    return map(fileInfoDb);
  }
}

async function map(fileInfoDb: any): Promise<FileInfo> {
  return new FileInfo(
    fileInfoDb.name,
    fileInfoDb.uploadAt,
    fileInfoDb.size,
    fileInfoDb.storage.toString(),
    fileInfoDb.parent?.toString(),
    fileInfoDb._id.toString(),
    fileInfoDb.updateAt
  );
}

export default FileInfoRepository;
