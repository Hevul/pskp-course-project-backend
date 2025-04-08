import UserStorage from "../../../../../core/src/entities/UserStorage";
import IUserStorageRepository from "../../../../../core/src/repositories/IUserStorageRepository";
import UserStorageAlreadyExistsError from "./errors/UserStorageAlreadyExistsError";
import UserStorageNotFoundError from "./errors/UserStorageNotFoundError";
import UserStorageDb from "./UserStorageDb";

class UserStorageRepository implements IUserStorageRepository {
  async getAll(): Promise<UserStorage[]> {
    const userStorageDbs = await UserStorageDb.find();

    return Promise.all(userStorageDbs.map(map));
  }

  async update(userStorage: UserStorage): Promise<UserStorage> {
    const { name, id } = userStorage;

    const updatedData = {
      name,
    };

    try {
      await UserStorageDb.updateOne({ _id: id }, { $set: updatedData });
    } catch {
      throw new UserStorageNotFoundError();
    }

    return this.get(id);
  }

  async exists(id: string): Promise<boolean> {
    try {
      return (await UserStorageDb.exists({ _id: id })) !== null;
    } catch {
      return false;
    }
  }

  async delete(id: string): Promise<UserStorage> {
    const userStorage = await this.get(id);

    await UserStorageDb.deleteOne({ _id: userStorage.id });

    return userStorage;
  }

  async add(userStorage: UserStorage): Promise<UserStorage> {
    const { ownerId: owner, name } = userStorage;

    try {
      const userStorageDb = await UserStorageDb.create({
        name,
        owner,
      });

      return map(userStorageDb);
    } catch (error: any) {
      if (error.code === 11000) throw new UserStorageAlreadyExistsError();
      else throw error;
    }
  }

  async get(id: string): Promise<UserStorage> {
    try {
      const userStorageDb = await UserStorageDb.findById(id);

      if (!userStorageDb) throw new UserStorageNotFoundError();

      return map(userStorageDb);
    } catch {
      throw new UserStorageNotFoundError();
    }
  }
}

async function map(userStorageDb: any) {
  const userStorage = new UserStorage(
    userStorageDb.name,
    userStorageDb.owner.toString(),
    userStorageDb._id.toString()
  );

  return userStorage;
}

export default UserStorageRepository;
