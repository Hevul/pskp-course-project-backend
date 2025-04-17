import UserAlreadyExistsError from "./errors/UserAlreadyExistsError";
import UserNotFoundError from "./errors/UserNotFoundError";
import UserDb from "../user/UserDb";
import User from "../../../../../core/src/entities/User";
import IUserRepository from "../../../../../core/src/repositories/IUserRepository";

class UserRepository implements IUserRepository {
  async exists(id: string): Promise<boolean> {
    try {
      return (await UserDb.exists({ _id: id })) !== null;
    } catch {
      return false;
    }
  }

  async getAll(): Promise<User[]> {
    try {
      const usersDb = await UserDb.find({}).lean();
      return usersDb.map(
        (userDb) =>
          new User(userDb.login, userDb.password, userDb._id.toString())
      );
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  }

  async getById(id: string): Promise<User> {
    try {
      const userDb = await UserDb.findById(id);

      if (!userDb) throw new UserNotFoundError();

      return map(userDb);
    } catch {
      throw new UserNotFoundError();
    }
  }

  async add(user: User): Promise<User> {
    const { login, password } = user;

    try {
      const userDb = await UserDb.create({ login, password });
      return map(userDb);
    } catch (error: any) {
      if (error.code === 11000) throw new UserAlreadyExistsError();
      else throw error;
    }
  }

  async existsByLogin(login: string): Promise<boolean> {
    try {
      return (await UserDb.exists({ login })) !== null;
    } catch {
      return false;
    }
  }

  async getByLogin(login: string): Promise<User> {
    const userDb = await UserDb.findOne({ login });

    if (!userDb) throw new UserNotFoundError();

    return map(userDb);
  }
}

async function map(userDb: any): Promise<User> {
  return new User(userDb.login, userDb.password, userDb._id.toString());
}

export default UserRepository;
