import DirInfo from "../../../core/src/entities/DirInfo";
import { DirInfoFullInfoDTO } from "../dtos/DirInfoFullInfoDTO";
import { Readable } from "stream";

export default interface IDirService {
  getAllByStorageId(storageId: string): Promise<DirInfo[]>;
  getFullInfo(id: string): Promise<DirInfoFullInfoDTO>;
  create(name: string, storageId: string, parentId?: string): Promise<DirInfo>;
  delete(id: string): Promise<DirInfo>;
  rename(id: string, name: string): Promise<DirInfo>;
  getSize(id: string): Promise<number>;
  copy(id: string, destinationId?: string): Promise<DirInfo>;
  move(options: {
    id: string;
    destinationId?: string;
    newName?: string;
    overwrite?: boolean;
  }): Promise<DirInfo>;
  download(id: string): Promise<{ fileStream: Readable; archiveName: string }>;
  downloadMultiple(ids: string[]): Promise<{
    archiveName: string;
    fileStream: Readable;
  }>;
}
