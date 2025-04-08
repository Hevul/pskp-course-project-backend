import User from "../../../core/src/entities/User";

export default interface IUserService {
  register(login: string, password: string): Promise<User>;
  getById(id: string): Promise<User>;
  getByLogin(login: string): Promise<User>;
  getByIds(ids: string[]): Promise<User[]>;
}
