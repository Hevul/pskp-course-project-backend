import { Readable } from "stream";
import FileInfo from "../../../core/src/entities/FileInfo";

export default interface IFileService {
  upload(
    name: string,
    data: Buffer,
    storageId: string,
    parentId?: string
  ): Promise<FileInfo>;
  uploadStream(
    filename: string,
    stream: Readable,
    storageId: string,
    size: number,
    parentId?: string
  ): Promise<FileInfo>;
  download(pathname: string): Promise<[FileInfo, string]>;
  delete(id: string): Promise<FileInfo>;
  overwrite(id: string, data: Buffer): Promise<FileInfo>;
  copy(id: string, parentId?: string): Promise<FileInfo>;
  move(id: string, destinationId?: string): Promise<FileInfo>;
  rename(id: string, name: string): Promise<FileInfo>;
  get(id: string): Promise<FileInfo>;
  getAllByStorageId(id: string): Promise<FileInfo[]>;
}
