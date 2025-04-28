import { Readable } from "stream";

export interface IEntityService {
  downloadMultiple(options: {
    fileIds: string[];
    dirIds: string[];
  }): Promise<{ archiveName: string; fileStream: Readable }>;
}
