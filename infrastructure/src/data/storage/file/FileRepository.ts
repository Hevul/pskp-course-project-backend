import { createReadStream, createWriteStream, promises as fs } from "fs";
import FileAlreadyExistsError from "./errors/FileAlreadyExistsError";
import IFileRepository from "../../../../../core/src/repositories/IFileRepository";
import StorageRepository from "../StorageRepository";
import FileNotFoundError from "./errors/FileNotFoundError";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

class FileRepository extends StorageRepository implements IFileRepository {
  get dir(): string {
    return this.dir;
  }

  async saveStream(pathname: string, readableStream: Readable): Promise<void> {
    if (await super.exists(pathname)) throw new FileAlreadyExistsError();

    const writeStream = createWriteStream(`${super.dir}${pathname}`);

    try {
      await pipeline(readableStream, writeStream);
    } catch (error) {
      writeStream.destroy();
      throw error;
    } finally {
      if (!writeStream.destroyed) writeStream.end();
    }
  }

  async overwrite(pathname: string, readableStream: Readable): Promise<void> {
    await this.rm(pathname);
    await this.saveStream(pathname, readableStream);
  }

  async getStream(pathname: string): Promise<Readable> {
    const fullPath = `${super.dir}${pathname}`;

    if (!(await super.exists(pathname))) throw new FileNotFoundError();

    return createReadStream(fullPath);
  }

  async rm(pathname: string): Promise<void> {
    const path = `${super.dir}${pathname}`;

    const isFileExists = await super.exists(pathname);

    if (!isFileExists) throw new FileNotFoundError();

    await fs.unlink(path);
  }
}

export default FileRepository;
