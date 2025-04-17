import User from "../entities/User";

export default interface IUserRepository {
  getAll(): Promise<User[]>;
  add(user: User): Promise<User>;
  exists(id: string): Promise<boolean>;
  existsByLogin(login: string): Promise<boolean>;
  getByLogin(login: string): Promise<User>;
  getById(id: string): Promise<User>;
}
