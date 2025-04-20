import mongoose from "mongoose";
import FileLink from "../../../../../core/src/entities/FileLink";
import IFileLinkRepository from "../../../../../core/src/repositories/IFileLinkRepository";
import FileLinkNotFoundError from "./errors/FileLinkNotFoundError";
import FileLinkDb from "./FileLinkDb";
import FileLinkAlreadyExistsError from "./errors/FileLinkAlreadyExists";

class FileLinkRepository implements IFileLinkRepository {
  async getAllByOwnerId(ownerId: string): Promise<FileLink[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(ownerId)) return [];

      const fileLinksDb = await FileLinkDb.find({ owner: ownerId });

      return fileLinksDb.map(map);
    } catch (error) {
      console.error("Error in getAllByOwnerId:", error);
      return [];
    }
  }

  async getByFileInfoId(fileInfoId: string): Promise<FileLink> {
    try {
      const fileLinkDb = await FileLinkDb.findOne({ file: fileInfoId });

      if (!fileLinkDb) throw new FileLinkNotFoundError();

      return map(fileLinkDb);
    } catch {
      throw new FileLinkNotFoundError();
    }
  }

  async update(fileLink: FileLink): Promise<FileLink> {
    const { id, link, friends, isPublic, createAt, downloadCount } = fileLink;

    const updatedData = {
      link,
      friends,
      isPublic,
      createAt,
      downloadCount,
    };

    try {
      await FileLinkDb.updateOne({ _id: id }, { $set: updatedData });
    } catch (error: any) {
      throw new FileLinkNotFoundError();
    }

    return this.get(id);
  }

  async delete(id: string): Promise<FileLink> {
    let fileLinkDb: any;

    try {
      fileLinkDb = await FileLinkDb.findById(id);
    } catch {
      throw new FileLinkNotFoundError();
    }

    if (!fileLinkDb) throw new FileLinkNotFoundError();

    await FileLinkDb.deleteOne({ _id: id });

    return map(fileLinkDb);
  }

  async deleteByFileInfoId(fileInfoId: string): Promise<void> {
    await FileLinkDb.deleteOne({ file: fileInfoId });
  }

  async exists(id: string): Promise<boolean> {
    try {
      return (await FileLinkDb.exists({ _id: id })) !== null;
    } catch {
      return false;
    }
  }

  async existsByFileId(fileId: string): Promise<boolean> {
    try {
      return (await FileLinkDb.exists({ file: fileId })) !== null;
    } catch {
      return false;
    }
  }

  async get(id: string): Promise<FileLink> {
    try {
      const fileLinkDb = await FileLinkDb.findById(id);

      if (!fileLinkDb) throw new FileLinkNotFoundError();

      return map(fileLinkDb);
    } catch {
      throw new FileLinkNotFoundError();
    }
  }

  async getByLink(link: string): Promise<FileLink> {
    try {
      const fileLinkDb = await FileLinkDb.findOne({ link });

      if (!fileLinkDb) throw new FileLinkNotFoundError();

      return map(fileLinkDb);
    } catch {
      throw new FileLinkNotFoundError();
    }
  }

  async add(fileLink: FileLink): Promise<FileLink> {
    const {
      link,
      ownerId,
      fileInfoId,
      friends,
      isPublic,
      createAt,
      downloadCount,
    } = fileLink;

    try {
      const fileLinkDb = await FileLinkDb.create({
        link,
        owner: ownerId,
        file: fileInfoId,
        friends,
        isPublic,
        createAt,
        downloadCount,
      });

      return map(fileLinkDb);
    } catch (error: any) {
      if (error.code === 11000) throw new FileLinkAlreadyExistsError();
      throw error;
    }
  }
}

function map(dbDocument: mongoose.Document) {
  const { _id, link, owner, file, isPublic, friends, createAt, downloadCount } =
    dbDocument.toObject();

  return new FileLink(
    link,
    owner.toString(),
    file.toString(),
    friends.map((f: mongoose.Types.ObjectId) => f.toString()),
    isPublic,
    createAt,
    downloadCount,
    _id.toString()
  );
}

export default FileLinkRepository;
