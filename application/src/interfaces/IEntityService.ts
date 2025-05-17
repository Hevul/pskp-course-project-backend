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
    success: boolean;
    conflictingFiles: { movedId: string; originalId: string }[];
    conflictingDirs: { movedId: string; originalId: string }[];
    errors?: Array<{
      id: string;
      name: string;
      type: "file" | "dir";
      error: string;
    }>;
  }>;
  copyMultiple(options: {
    fileIds: string[];
    dirIds: string[];
    destinationId?: string;
  }): Promise<{
    success: boolean;
    errors?: Array<{
      id: string;
      name: string;
      type: "file" | "dir";
      error: string;
    }>;
  }>;
}
