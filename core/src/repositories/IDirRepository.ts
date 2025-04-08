export default interface IDirRepository {
  rm(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copy(oldPath: string, newPath: string): Promise<void>;
}
