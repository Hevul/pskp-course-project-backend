import User from "../../../core/src/entities/User";
import IUserRepository from "../../../core/src/repositories/IUserRepository";
import IHashProvider from "../interfaces/IHashProvider";
import IUserService from "../interfaces/IUserService";
import UserAlreadyRegisteredError from "../errors/UserAlreadyRegisteredError";

class UserService implements IUserService {
  constructor(
    private readonly _repository: IUserRepository,
    private readonly _hash: IHashProvider
  ) {}

  async getByIds(ids: string[]): Promise<User[]> {
    let users = await this._repository.getAll();
    users = users.filter((f) => ids.includes(f.id));

    return users;
  }

  async getByLogin(login: string): Promise<User> {
    const user = await this._repository.getByLogin(login);
    return user;
  }

  async getById(id: string): Promise<User> {
    const user = await this._repository.getById(id);
    return user;
  }

  async register(login: string, password: string): Promise<User> {
    const exists = await this._repository.existsByLogin(login);

    if (exists) throw new UserAlreadyRegisteredError();

    const user = new User(login, password);

    const hashedPassword = this._hash.generate(password);

    user.password = hashedPassword;

    return await this._repository.add(user);
  }
}

export default UserService;
