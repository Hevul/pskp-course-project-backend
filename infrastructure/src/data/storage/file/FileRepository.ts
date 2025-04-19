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

  async overwrite(pathname: string, data: Buffer): Promise<void> {
    if (!(await super.exists(pathname))) throw new FileNotFoundError();

    await fs.writeFile(`${super.dir}${pathname}`, data);
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

  async move(oldPathname: string, newPathname: string): Promise<void> {
    const fullOldPath = `${super.dir}${oldPathname}`;
    const fullNewPath = `${super.dir}${newPathname}`;

    if (!(await super.exists(oldPathname))) throw new FileNotFoundError();
    if (await super.exists(newPathname)) throw new FileAlreadyExistsError();

    await fs.rename(fullOldPath, fullNewPath);
  }

  async copy(
    sourcePathname: string,
    destinationPathname: string
  ): Promise<void> {
    const fullSourcePath = `${super.dir}${sourcePathname}`;
    const fullDestinationPath = `${super.dir}${destinationPathname}`;

    if (!(await super.exists(sourcePathname))) throw new FileNotFoundError();

    if (await super.exists(destinationPathname))
      throw new FileAlreadyExistsError();

    const readStream = createReadStream(fullSourcePath);
    const writeStream = createWriteStream(fullDestinationPath);

    try {
      await pipeline(readStream, writeStream);
    } catch (error) {
      try {
        if (await super.exists(destinationPathname)) {
          await fs.unlink(fullDestinationPath);
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup after failed copy:", cleanupError);
      }
      throw error;
    } finally {
      if (!readStream.destroyed) readStream.destroy();
      if (!writeStream.destroyed) writeStream.destroy();
    }
  }
}

export default FileRepository;
