import mongoose from "mongoose";
import {
  connect,
  HashSha256Provider,
  InvalidLoginError,
  InvalidPasswordError,
  JwtProvider,
  UserAlreadyRegisteredError,
  UserDb,
  UserRepository,
  UserService,
} from "../utils/imports";
import { USER_SERVICE_DB } from "../utils/dbs";
import {
  ANOTHER_PASSWORD,
  LOGIN,
  PASSWORD,
  SECRET_KEY,
} from "../utils/constants";
import "../utils/customMatchers";

describe("UserService", () => {
  let userRepository: UserRepository;
  let hashProvider: HashSha256Provider;
  let userService: UserService;

  beforeAll(async () => {
    await connect(USER_SERVICE_DB);

    userRepository = new UserRepository();
    hashProvider = new HashSha256Provider();
    userService = new UserService(userRepository, hashProvider);
  });

  afterEach(async () => {
    await UserDb.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it(`registers user`, async () => {
    // ACT
    const user = await userService.register(LOGIN, PASSWORD);

    // ASSERT
    const exists = UserDb.exists({ _id: user.id });
    expect(exists).toBeTruthy();
  });

  it(`throws UserAlreadyRegisteredError
        when attempting to register user with the same login`, async () => {
    // ASSIGN
    const user = await userService.register(LOGIN, PASSWORD);

    // ACT
    // ASSERT
    await expect(
      userService.register(user.login, user.password)
    ).rejects.toThrow(UserAlreadyRegisteredError);
  });
});
