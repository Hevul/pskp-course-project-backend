import { Readable } from "stream";

export interface IEntityService {
  downloadMultiple(options: {
    fileIds: string[];
    dirIds: string[];
  }): Promise<{ archiveName: string; fileStream: Readable }>;
  moveMultiple(options: {
    fileIds: string[];
    dirIds: string[];
    destinationId?: string;
    overwrite?: boolean;
  }): Promise<{
    conflictingFiles: { movedId: string; originalId: string }[];
    conflictingDirs: { movedId: string; originalId: string }[];
  }>;
  copyMultiple(options: {
    fileIds: string[];
    dirIds: string[];
    destinationId?: string;
  }): Promise<void>;
}
