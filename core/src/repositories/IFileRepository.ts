import { Readable } from "stream";

export default interface IFileRepository {
  saveStream(pathname: string, readableStream: Readable): Promise<void>;
  overwrite(pathname: string, readableStream: Readable): Promise<void>;
  getStream(pathname: string): Promise<Readable>;
  rm(pathname: string): Promise<void>;
}
