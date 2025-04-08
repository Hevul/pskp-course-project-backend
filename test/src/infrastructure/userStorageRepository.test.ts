import mongoose from "mongoose";
import { USER_STORAGE_REPOSITORY_DB } from "../utils/dbs";
import {
  ANOTHER_LOGIN,
  ANOTHER_PASSWORD,
  FAKE_STORAGE_ID,
  LOGIN,
  PASSWORD,
  STORAGE_NAME,
} from "../utils/constants";
import {
  connect,
  User,
  UserDb,
  UserRepository,
  UserStorage,
  UserStorageAlreadyExistsError,
  UserStorageDb,
  UserStorageNotFoundError,
  UserStorageRepository,
} from "../utils/imports";
import "../utils/customMatchers";

describe("UserStorageRepository", () => {
  const defaultUser1 = new User(LOGIN, PASSWORD);
  const defaultUser2 = new User(ANOTHER_LOGIN, ANOTHER_PASSWORD);

  let userRepository: UserRepository;
  let userStorageRepository: UserStorageRepository;

  beforeAll(async () => {
    await connect(USER_STORAGE_REPOSITORY_DB);
    userRepository = new UserRepository();
    userStorageRepository = new UserStorageRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await UserDb.deleteMany({});
    await UserStorageDb.deleteMany({});
  });

  const createStorage = async (user: User) => {
    return await userStorageRepository.add(
      new UserStorage(STORAGE_NAME, user.id)
    );
  };

  it("adds userStorage", async () => {
    const user = await userRepository.add(defaultUser1);

    const storage = await createStorage(user);

    expect(storage.id).toExistInDatabase(userStorageRepository);
  });

  it(`throws UserStorageAlreadyExistsError
      when attempting to add 2 storage with the same name for one user`, async () => {
    const user = await userRepository.add(defaultUser1);

    const storage = await createStorage(user);

    await expect(userStorageRepository.add(storage)).rejects.toThrow(
      UserStorageAlreadyExistsError
    );
  });

  it(`adds 2 storage with the same name for different users`, async () => {
    // ASSIGN
    const user1 = await userRepository.add(defaultUser1);
    const user2 = await userRepository.add(defaultUser2);

    // ACT
    const storage1 = await createStorage(user1);
    const storage2 = await createStorage(user2);

    // ASSERT
    expect(storage1.name).toBe(storage2.name);
    expect(storage1.id).not.toBe(storage2.id);
  });

  it(`returns userStorage by id
      when userStorage exists`, async () => {
    // ASSIGN
    const user = await userRepository.add(defaultUser1);
    const storage = await createStorage(user);

    // ACT
    const foundStorage = await userStorageRepository.get(storage.id);

    // ASSERT
    expect(storage.id).toBe(foundStorage.id);
    expect(storage.name).toBe(foundStorage.name);
    expect(storage.ownerId).toBe(foundStorage.ownerId);
  });

  it(`throws UserStorageNotFoundError
      when attempting to get userStorage with non-existing id`, async () => {
    expect(userStorageRepository.get(FAKE_STORAGE_ID)).rejects.toThrow(
      UserStorageNotFoundError
    );
  });

  it(`delete userStorage
      when userStorage exists`, async () => {
    // ASSIGN
    const user = await userRepository.add(defaultUser1);
    const storage = await createStorage(user);

    // ACT
    await userStorageRepository.delete(storage.id);

    // ASSERT
    expect(storage).not.toExistInDatabase(userStorageRepository);
  });

  it(`throws UserStorageNotFoundError
      when attempting to delete non-existing userStorage`, async () => {
    await expect(userStorageRepository.delete(FAKE_STORAGE_ID)).rejects.toThrow(
      UserStorageNotFoundError
    );
  });
});
