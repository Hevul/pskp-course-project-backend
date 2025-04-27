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
  move(id: string, destinationId?: string): Promise<DirInfo>;
  download(id: string): Promise<{ stream: Readable; size: number }>;
}
