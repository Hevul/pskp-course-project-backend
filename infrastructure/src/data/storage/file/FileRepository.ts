import { createWriteStream, promises as fs } from "fs";
import pathM from "path";
import PathCannotBeEmptyError from "./errors/PathCannotBeEmptyError";
import InvalidCharsInPathError from "./errors/InvalidCharsInPathError";
import AbsolutePathNotAllowedError from "./errors/AbsolutePathNotAllowedError";
import PathOutsideBaseDirectoryError from "./errors/PathOutsideBaseDirectoryError";
import PathnameMaxLengthError from "./errors/PathnameMaxLengthError";
import FileAlreadyExistsError from "./errors/FileAlreadyExistsError";
import IFileRepository from "../../../../../core/src/repositories/IFileRepository";
import StorageRepository from "../StorageRepository";
import FileNotFoundError from "./errors/FileNotFoundError";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

class FileRepository extends StorageRepository implements IFileRepository {
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

  async save(pathname: string, data: Buffer): Promise<void> {
    if (await super.exists(pathname)) throw new FileAlreadyExistsError();

    await fs.writeFile(`${super.dir}${pathname}`, data);
  }

  async overwrite(pathname: string, data: Buffer): Promise<void> {
    if (!(await super.exists(pathname))) throw new FileNotFoundError();

    await fs.writeFile(`${super.dir}${pathname}`, data);
  }

  async get(pathname: string): Promise<Buffer> {
    const fullPath = `${super.dir}${pathname}`;

    const isFileExists = await super.exists(pathname);

    if (!isFileExists) throw new FileNotFoundError();

    const data = await fs.readFile(fullPath);
    return data;
  }

  async rm(pathname: string): Promise<void> {
    const path = `${super.dir}${pathname}`;

    const isFileExists = await super.exists(pathname);

    if (!isFileExists) throw new FileNotFoundError();

    await fs.unlink(path);
  }

  validatePath(pathname: string) {
    if (!pathname) throw new PathCannotBeEmptyError();

    if (pathname.startsWith("./")) throw new AbsolutePathNotAllowedError();

    const maxLength = 255;
    if (pathname.length > maxLength) throw new PathnameMaxLengthError();

    const invalidChars = /[<>:"\\|?*\x00-\x1F]/;
    if (invalidChars.test(pathname)) throw new InvalidCharsInPathError();

    const resolvedPath = pathM.resolve(super.dir, pathname);
    if (!resolvedPath.startsWith(super.dir))
      throw new PathOutsideBaseDirectoryError();
  }
}

export default FileRepository;
