import DirInfo from "../../../core/src/entities/DirInfo";

export default interface IDirService {
  getAllByStorageId(storageId: string): Promise<DirInfo[]>;
  create(name: string, storageId: string, parentId?: string): Promise<DirInfo>;
  delete(id: string, force: boolean): Promise<DirInfo>;
  rename(id: string, name: string): Promise<DirInfo>;
  getSize(id: string): Promise<number>;
  copy(id: string, destinationId?: string): Promise<DirInfo>;
  move(id: string, destinationId?: string): Promise<DirInfo>;
}
