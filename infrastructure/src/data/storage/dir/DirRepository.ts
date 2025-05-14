import { promises as fs } from "fs";
import { join } from "path";
import IDirRepository from "../../../../../core/src/repositories/IDirRepository";
import DirectoryAlreadyExistsError from "./errors/DirectoryAlreadyExistsError";
import DirectoryNotFoundError from "./errors/DirectoryNotFoundError";
import StorageRepository from "../StorageRepository";

class DirRepository extends StorageRepository implements IDirRepository {
  async rm(path: string): Promise<void> {
    const isDirExists = await super.exists(path);

    if (!isDirExists) throw new DirectoryNotFoundError();

    await fs.rm(`/${super.dir}${path}`, { recursive: true, force: true });
  }

  async mkdir(path: string): Promise<void> {
    if (await this.exists(path)) throw new DirectoryAlreadyExistsError();

    const parentPath = path.substring(0, path.lastIndexOf("/"));

    const isParentDirExists = await this.exists(parentPath);

    if (!isParentDirExists) throw new DirectoryNotFoundError();

    await fs.mkdir(`${super.dir}${path}`);
  }
}

export default DirRepository;
