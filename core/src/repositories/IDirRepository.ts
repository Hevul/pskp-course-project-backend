export default interface IDirRepository {
  rm(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}
