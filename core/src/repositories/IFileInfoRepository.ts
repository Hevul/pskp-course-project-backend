import { FileInfo } from "../entities/FileInfo";

export default interface IFileInfoRepository {
  add(fileInfo: FileInfo): Promise<FileInfo>;
  get(id: string): Promise<FileInfo>;
  delete(id: string): Promise<FileInfo>;
  getAll(): Promise<FileInfo[]>;
  update(fileInfo: FileInfo): Promise<FileInfo>;
  getPathname(id: string): Promise<string>;
  exists(id: string): Promise<boolean>;
  count(query: { [key: string]: any }): Promise<number>;
  find(query: { [key: string]: any }): Promise<FileInfo[]>;
  getRefCount(physicalFileId: string): Promise<number>;
}
