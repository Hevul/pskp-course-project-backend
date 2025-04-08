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

  let jwtProvider: JwtProvider;
  let hashProvider: HashSha256Provider;

  let userService: UserService;

  beforeAll(async () => {
    await connect(USER_SERVICE_DB);

    userRepository = new UserRepository();

    jwtProvider = new JwtProvider(SECRET_KEY);
    hashProvider = new HashSha256Provider();

    userService = new UserService(userRepository, jwtProvider, hashProvider);
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
    expect(user.login).toExistInDatabase(userRepository);
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

  it(`returns jwt token
        when user is attempting to login`, async () => {
    // ASSIGN
    const user = await userService.register(LOGIN, PASSWORD);

    // ACT
    const jwtToken = await userService.login(LOGIN, PASSWORD);

    // ASSERT
    expect(jwtToken).toBe(jwtProvider.generate(user));
  });

  it(`throws UserNotFoundError
        when attempting to login with non-existing user`, async () => {
    // ACT
    // ASSERT
    await expect(userService.login(LOGIN, PASSWORD)).rejects.toThrow(
      InvalidLoginError
    );
  });

  it(`throws InvalidPasswordError
        when attempting to login with invalid password`, async () => {
    // ASSIGN
    const user = await userService.register(LOGIN, PASSWORD);

    // ACT
    // ASSERT
    await expect(userService.login(LOGIN, ANOTHER_PASSWORD)).rejects.toThrow(
      InvalidPasswordError
    );
  });
});
