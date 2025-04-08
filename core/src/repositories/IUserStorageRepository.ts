import UserStorage from "../entities/UserStorage";

export default interface IUserStorageRepository {
  add(userStorage: UserStorage): Promise<UserStorage>;
  getAll(): Promise<UserStorage[]>;
  get(id: string): Promise<UserStorage>;
  delete(id: string): Promise<UserStorage>;
  exists(id: string): Promise<boolean>;
  update(userStorage: UserStorage): Promise<UserStorage>;
}
