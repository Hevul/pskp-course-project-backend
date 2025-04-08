import request from "supertest";
import express from "express";
import {
  InvalidLoginError,
  InvalidPasswordError,
  IUserService,
  User,
  UserAlreadyRegisteredError,
  UserController,
} from "../utils/imports";
import { LOGIN, PASSWORD, TOKEN, USER_ID } from "../utils/constants";
import "../utils/customMatchers";
import createUserRouter from "../../../web/src/routers/userRouter";
import extendResponse from "../../../web/src/middlewares/utils/extendResponse";

const userService: IUserService = {
  getById: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
};

const userController = new UserController(userService);
const userRouter = createUserRouter(userController);

const app = express();
app.use(express.json());
app.use(extendResponse);
app.use(userRouter);

describe("User routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /login", () => {
    const sendRequest = async () => {
      return request(app)
        .post("/login")
        .send({ login: LOGIN, password: PASSWORD });
    };

    it("returns token on successful login", async () => {
      // ASSIGN
      userService.login = jest.fn().mockResolvedValue(TOKEN);

      // ACT
      const response = await sendRequest();

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response.body).toEqual({ token: TOKEN, ok: true });
      expect(response.headers["authorization"]).toBe(`Bearer ${TOKEN}`);
    });

    it(`returns 400 and InvalidLoginError
        when attempting to login with invalid login`, async () => {
      // ASSIGN
      userService.login = jest.fn().mockRejectedValue(new InvalidLoginError());

      // ACT
      const response = await sendRequest();

      // ASSERT
      expect(response).toHaveCode(400);
      expect(response.body).toBeError(InvalidLoginError);
    });

    it(`returns 400 and InvalidPasswordError
        when attempting to login with invalid password`, async () => {
      // ASSIGN
      userService.login = jest
        .fn()
        .mockRejectedValue(new InvalidPasswordError());

      // ACT
      const response = await sendRequest();

      // ASSERT
      expect(response).toHaveCode(400);
      expect(response.body).toBeError(InvalidPasswordError);
    });
  });

  describe("POST /register", () => {
    const sendRequest = async () => {
      return request(app)
        .post("/register")
        .send({ login: LOGIN, password: PASSWORD });
    };

    it(`returns 201 on successful registration`, async () => {
      // ASSIGN
      userService.register = jest
        .fn()
        .mockResolvedValue(new User(USER_ID, LOGIN, PASSWORD));

      // ACT
      const response = await sendRequest();

      // ASSERT
      expect(response).toHaveCode(201);
      expect(response.body).toEqual({ message: "User created!", ok: true });
    });

    it(`returns 400 and UserAlreadyRegisteredError
        when attempting to register with the same login`, async () => {
      // ASSIGN
      userService.register = jest
        .fn()
        .mockRejectedValue(new UserAlreadyRegisteredError());

      // ACT
      const response = await sendRequest();

      // ASSERT
      expect(response).toHaveCode(400);
      expect(response.body).toBeError(UserAlreadyRegisteredError);
    });
  });
});
