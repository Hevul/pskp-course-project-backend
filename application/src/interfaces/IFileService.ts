import { Readable } from "stream";
import { FileInfo } from "../../../core/src/entities/FileInfo";

export default interface IFileService {
  upload(
    filename: string,
    stream: Readable,
    storageId: string,
    size: number,
    parentId?: string
  ): Promise<FileInfo>;
  download(pathname: string): Promise<[FileInfo, Readable]>;
  downloadMultiple(ids: string[]): Promise<{
    archiveName: string;
    fileStream: Readable;
  }>;
  delete(id: string): Promise<FileInfo>;
  copy(id: string, destinationId?: string): Promise<FileInfo>;
  move(options: {
    id: string;
    destinationId?: string;
    newName?: string;
    overwrite?: boolean;
  }): Promise<FileInfo>;
  rename(id: string, name: string): Promise<FileInfo>;
  get(id: string): Promise<FileInfo>;
  getAllByStorageId(id: string): Promise<FileInfo[]>;
  checkFileExists(
    filename: string,
    storageId: string,
    parentId?: string
  ): Promise<FileInfo | null>;
  overwrite(
    fileId: string,
    fileStream: Readable,
    newSize: number
  ): Promise<FileInfo>;
}
