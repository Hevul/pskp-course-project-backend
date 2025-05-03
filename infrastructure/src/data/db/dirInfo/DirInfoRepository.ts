import DirInfoNotFoundError from "./errors/DirInfoNotFoundError";
import DirInfoDb from "../dirInfo/DirInfoDb";
import IDirInfoRepository from "../../../../../core/src/repositories/IDirInfoRepository";
import DirInfo from "../../../../../core/src/entities/DirInfo";
import DirInfoAlreadyExistsError from "./errors/DirInfoAlreadyExistsError";
import mongoose, { Types } from "mongoose";
import FileInfoDb from "../fileInfo/FileInfoDb";

class DirInfoRepository implements IDirInfoRepository {
  async getRecursiveCounts(
    id: string
  ): Promise<{ fileCount: number; dirCount: number }> {
    const allDirIds = await this._getAllSubdirectoryIds(this._toObjectId(id));

    const allIdsForFiles = [...allDirIds, this._toObjectId(id)];

    const [fileCount, dirCount] = await Promise.all([
      FileInfoDb.countDocuments({ parent: { $in: allIdsForFiles } }),
      DirInfoDb.countDocuments({
        _id: { $in: allDirIds },
      }),
    ]);

    return { fileCount, dirCount };
  }

  private async _getAllSubdirectoryIds(
    dirId: Types.ObjectId
  ): Promise<Types.ObjectId[]> {
    const result = await DirInfoDb.aggregate([
      { $match: { _id: dirId } },
      {
        $graphLookup: {
          from: "dirinfos",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parent",
          as: "allSubDirs",
          depthField: "depth",
        },
      },
      { $unwind: "$allSubDirs" },
      {
        $project: {
          _id: "$allSubDirs._id",
          isParent: { $eq: ["$allSubDirs._id", dirId] },
        },
      },
      { $match: { isParent: false } },
      { $project: { _id: 1 } },
    ]).exec();

    return result.map((doc) => doc._id);
  }

  async getSize(id: string): Promise<number> {
    let totalSize = 0;

    const files = await FileInfoDb.find({ parent: id }).select("size").exec();
    totalSize += files.reduce((sum, file) => sum + file.size, 0);

    const subDirs = await DirInfoDb.find({ parent: id }).select("_id").exec();
    for (const dir of subDirs) {
      totalSize += await this.getSize(dir._id.toString());
    }

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

      return this._toDomainEntity(dirInfoDb);
    } catch (error: any) {
      if (error.code === 11000) throw new DirInfoAlreadyExistsError();
      else throw error;
    }
  }

  async update(dirInfo: DirInfo): Promise<DirInfo> {
    const { id, name, parent } = dirInfo;

    const updatedData = {
      name,
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
    } catch (error: any) {
      throw new DirInfoNotFoundError();
    }

    return this.get(id);
  }

  async get(id: string): Promise<DirInfo> {
    try {
      const dirInfoDb = await DirInfoDb.findById(id);

      if (!dirInfoDb) throw new DirInfoNotFoundError();

      return this._toDomainEntity(dirInfoDb);
    } catch {
      throw new DirInfoNotFoundError();
    }
  }

  async delete(id: string): Promise<DirInfo> {
    const dirInfo = await this.get(id);

    await DirInfoDb.deleteOne({ _id: id });

    return dirInfo;
  }

  async getAll(): Promise<DirInfo[]> {
    const dirInfosDb = await DirInfoDb.find();

    return Promise.all(dirInfosDb.map(this._toDomainEntity));
  }

  async find(query: { [key: string]: any }): Promise<DirInfo[]> {
    const processedQuery = this._processQuery(query);

    const docs = await DirInfoDb.find(processedQuery).lean().exec();

    return docs.map(this._toDomainEntity);
  }

  async count(query: { [key: string]: any }): Promise<number> {
    const processedQuery = this._processQuery(query);
    return DirInfoDb.countDocuments(processedQuery).exec();
  }

  private _toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === "string" ? new Types.ObjectId(id) : id;
  }

  private _toDomainEntity(dbDoc: any): DirInfo {
    return new DirInfo(
      dbDoc.name,
      dbDoc.uploadAt,
      dbDoc.storage.toString(),
      dbDoc.parent?.toString(),
      dbDoc._id.toString()
    );
  }

  private _processQuery(query: { [key: string]: any }): { [key: string]: any } {
    const processed = { ...query };

    if (processed.parent) processed.parent = this._toObjectId(processed.parent);

    if (processed.storage)
      processed.storage = this._toObjectId(processed.storage);

    if (processed._id) processed._id = this._toObjectId(processed._id);

    return processed;
  }
}

export default DirInfoRepository;
