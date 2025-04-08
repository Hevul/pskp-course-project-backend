import DirInfo from "../entities/DirInfo";

export default interface IDirInfoRepository {
  add(dirInfo: DirInfo): Promise<DirInfo>;
  update(dirInfo: DirInfo): Promise<DirInfo>;
  get(id: string): Promise<DirInfo>;
  delete(id: string, recursive?: boolean): Promise<DirInfo>;
  getAll(): Promise<DirInfo[]>;
  exists(id: string): Promise<boolean>;
  getPath(id: string): Promise<string>;
  getSize(id: string): Promise<number>;
}
