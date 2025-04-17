import DirInfoNotFoundError from "./errors/DirInfoNotFoundError";
import DirInfoDb from "../dirInfo/DirInfoDb";
import IDirInfoRepository from "../../../../../core/src/repositories/IDirInfoRepository";
import DirInfo from "../../../../../core/src/entities/DirInfo";
import DirInfoAlreadyExistsError from "./errors/DirInfoAlreadyExistsError";
import mongoose from "mongoose";
import FileInfoDb from "../fileInfo/FileInfoDb";

class DirInfoRepository implements IDirInfoRepository {
  async getSize(id: string): Promise<number> {
    let dirInfoDb: any;

    try {
      dirInfoDb = await DirInfoDb.findById(id)
        .populate("files")
        .populate("subdirectories");
    } catch {
      throw new DirInfoNotFoundError();
    }

    if (!dirInfoDb) throw new DirInfoNotFoundError();

    let totalSize = 0;

    for (const file of dirInfoDb.files) totalSize += file.size;

    for (const subDir of dirInfoDb.subdirectories)
      totalSize += await this.getSize(subDir._id.toString());

    return totalSize;
  }

  async getPath(id: string): Promise<string> {
    let dirInfo: any;

    try {
      dirInfo = await DirInfoDb.findById(id).populate("parent").exec();
    } catch {
      throw new DirInfoNotFoundError();
    }

    if (!dirInfo) throw new DirInfoNotFoundError();

    if (!dirInfo.parent) return `/${dirInfo.storage}/${dirInfo.name}`;

    const parentPath = await this.getPath(dirInfo.parent._id.toString());

    return `${parentPath}/${dirInfo.name}`;
  }

  async exists(id: string): Promise<boolean> {
    try {
      return (await DirInfoDb.exists({ _id: id })) !== null;
    } catch {
      return false;
    }
  }

  async add(dirInfo: DirInfo): Promise<DirInfo> {
    const { name, uploadAt, storage, parent } = dirInfo;

    try {
      const dirInfoDb = await DirInfoDb.create({
        name,
        uploadAt,
        storage,
        parent,
      });

      return map(dirInfoDb);
    } catch (error: any) {
      if (error.code === 11000) throw new DirInfoAlreadyExistsError();
      else throw error;
    }
  }

  async update(dirInfo: DirInfo): Promise<DirInfo> {
    const { id, name, files, subdirectories, parent } = dirInfo;

    const updatedData = {
      name,
      files,
      subdirectories,
      parent,
    };

    try {
      if (!parent) {
        await DirInfoDb.updateOne(
          { _id: id },
          { $set: updatedData, $unset: { parent: "" } }
        );
      } else {
        await DirInfoDb.updateOne({ _id: id }, { $set: updatedData });
      }
    } catch {
      throw new DirInfoNotFoundError();
    }

    return this.get(id);
  }

  async get(id: string): Promise<DirInfo> {
    try {
      const dirInfoDb = await DirInfoDb.findById(id);

      if (!dirInfoDb) throw new DirInfoNotFoundError();

      return map(dirInfoDb);
    } catch {
      throw new DirInfoNotFoundError();
    }
  }

  async delete(id: string, recursive: boolean = false): Promise<DirInfo> {
    const dirInfo = await this.get(id);

    if (recursive) {
      const subdirectories = await DirInfoDb.find({ parent: id }).populate(
        "files"
      );

      for (const subdirectory of subdirectories)
        await this.delete(subdirectory._id.toString(), true);

      for (const fileId of dirInfo.files)
        await FileInfoDb.findByIdAndDelete(fileId);
    }

    await DirInfoDb.deleteOne({ _id: id });

    return dirInfo;
  }

  async getAll(): Promise<DirInfo[]> {
    const dirInfosDb = await DirInfoDb.find();

    return Promise.all(dirInfosDb.map((d) => map(d)));
  }
}

async function map(dirInfoDb: any) {
  const dirInfo = new DirInfo(
    dirInfoDb.name,
    dirInfoDb.uploadAt,
    dirInfoDb.storage.toString(),
    dirInfoDb.parent?.toString(),
    dirInfoDb._id.toString()
  );

  dirInfo.files = [
    ...dirInfoDb.files.map((f: mongoose.Types.ObjectId) => f.toString()),
  ];

  dirInfo.subdirectories = [
    ...dirInfoDb.subdirectories.map((d: mongoose.Types.ObjectId) =>
      d.toString()
    ),
  ];

  return dirInfo;
}

export default DirInfoRepository;
