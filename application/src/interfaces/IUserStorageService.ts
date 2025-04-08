import UserStorage from "../../../core/src/entities/UserStorage";

export default interface IUserStorageService {
  create(name: string, ownerId: string): Promise<UserStorage>;
  get(id: string): Promise<UserStorage>;
  getAll(): Promise<UserStorage[]>;
  rename(id: string, name: string): Promise<UserStorage>;
  delete(id: string, force: boolean): Promise<UserStorage>;
}
