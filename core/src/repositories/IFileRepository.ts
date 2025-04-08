import { Readable } from "stream";

export default interface IFileRepository {
  save(pathname: string, data: Buffer): Promise<void>;
  saveStream(pathname: string, readableStream: Readable): Promise<void>;
  overwrite(pathname: string, data: Buffer): Promise<void>;
  get(pathname: string): Promise<Buffer>;
  rm(pathname: string): Promise<void>;
}
