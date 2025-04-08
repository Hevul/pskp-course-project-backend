import { promises as fs } from "fs";

export default abstract class StorageRepository {
  constructor(private readonly _dir: string) {}

  get dir(): string {
    return this._dir;
  }

  async exists(pathname: string): Promise<boolean> {
    try {
      await fs.access(`${this._dir}${pathname}`);
      return true;
    } catch {
      return false;
    }
  }
}
