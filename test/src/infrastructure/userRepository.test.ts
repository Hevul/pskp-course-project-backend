import mongoose from "mongoose";
import { LOGIN, PASSWORD, FAKE_LOGIN, FAKE_USER_ID } from "../utils/constants";
import { USER_REPOSITORY_DB } from "../utils/dbs";
import {
  connect,
  User,
  UserAlreadyExistsError,
  UserDb,
  UserNotFoundError,
  UserRepository,
} from "../utils/imports";

describe("UserRepository", () => {
  let userRepository: UserRepository;
  const user = new User(LOGIN, PASSWORD);

  beforeAll(async () => {
    await connect(USER_REPOSITORY_DB);
    userRepository = new UserRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await UserDb.deleteMany({});
  });

  it(`adds user 
      when login is unique`, async () => {
    const addedUser = await userRepository.add(user);

    expect(addedUser).toBeInstanceOf(User);
    expect(addedUser.login).toBe(LOGIN);
    expect(addedUser.password).toBe(PASSWORD);
  });

  it(`throws UserAlreadyExistsError 
      when attempting to add user with duplicate login`, async () => {
    await userRepository.add(user);

    await expect(userRepository.add(user)).rejects.toThrow(
      UserAlreadyExistsError
    );
  });

  it(`returns true 
      when user exists`, async () => {
    await userRepository.add(user);

    expect(await userRepository.exists(LOGIN)).toBe(true);
  });

  it(`returns false 
      when user doesn't exists`, async () => {
    await userRepository.add(user);

    expect(await userRepository.exists(FAKE_LOGIN)).toBe(false);
  });

  it(`returns user by 
      login when user exists`, async () => {
    const addedUser = await userRepository.add(user);

    const foundUser = await userRepository.getByLogin(LOGIN);

    expect(foundUser).toBeInstanceOf(User);
    expect(foundUser.id).toBe(addedUser.id);
    expect(foundUser.login).toBe(addedUser.login);
  });

  it(`throws UserNotFoundError 
      when user doesn't exists`, async () => {
    await expect(userRepository.getByLogin(FAKE_LOGIN)).rejects.toThrow(
      UserNotFoundError
    );
  });

  it(`returns user by id 
      when user exists`, async () => {
    const addedUser = await userRepository.add(user);

    const foundUser = await userRepository.getById(addedUser.id);

    expect(foundUser).toBeInstanceOf(User);
    expect(foundUser.id).toBe(addedUser.id);
    expect(foundUser.login).toBe(addedUser.login);
  });

  it(`throws UserNotFoundError 
      when user doesn't exists`, async () => {
    await expect(userRepository.getById(FAKE_USER_ID)).rejects.toThrow(
      UserNotFoundError
    );
  });
});
