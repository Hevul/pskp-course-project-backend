import { promises as fs } from "fs";
import { join } from "path";
import IDirRepository from "../../../../../core/src/repositories/IDirRepository";
import DirectoryAlreadyExistsError from "./errors/DirectoryAlreadyExistsError";
import DirectoryNotFoundError from "./errors/DirectoryNotFoundError";
import StorageRepository from "../StorageRepository";

class DirRepository extends StorageRepository implements IDirRepository {
  async copy(oldPath: string, newPath: string): Promise<void> {
    await this.mkdir(newPath);

    const entries = await fs.readdir(`${super.dir}${oldPath}`, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const oldEntryPath = join(`${super.dir}${oldPath}`, entry.name);
      const newEntryPath = join(`${super.dir}${newPath}`, entry.name);

      if (entry.isDirectory()) {
        await this.copy(`${oldPath}/${entry.name}`, `${newPath}/${entry.name}`);
      } else {
        await fs.copyFile(oldEntryPath, newEntryPath);
      }
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    if (!(await super.exists(oldPath))) throw new DirectoryNotFoundError();

    if (await super.exists(newPath)) throw new DirectoryAlreadyExistsError();

    await this.copy(oldPath, newPath);
    await this.rm(oldPath);
  }

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
