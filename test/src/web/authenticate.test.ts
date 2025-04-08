import request from "supertest";
import express from "express";
import authenticate from "../../../web/src/middlewares/utils/authenticate";
import IJwtProvider from "../../../application/src/interfaces/IJwtProvider";
import { IUserService, User } from "../utils/imports";
import extendResponse from "../../../web/src/middlewares/utils/extendResponse";
import "../utils/customMatchers";
import {
  INVALID_TOKEN,
  LOGIN,
  PASSWORD,
  TOKEN,
  USER_ID,
} from "../utils/constants";
import JwtPayload from "../../../application/src/interfaces/JwtPayload";

const jwtProvider: IJwtProvider = {
  generate: jest.fn(),
  verify: jest.fn(),
};

const userService: IUserService = {
  login: jest.fn(),
  register: jest.fn(),
  getById: jest.fn(),
};

const app = express();
app.use(express.json());
app.use(extendResponse);
app.use(authenticate(jwtProvider, userService));
app.get("/", (req, res, _) => {
  res.json({ user: req.user!, ok: true });
});

describe("Authenticate middleware", () => {
  const payload: JwtPayload = {
    id: USER_ID,
  };
  const user = new User(USER_ID, LOGIN, PASSWORD);

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it(`returns 401
      when token isn't provided`, async () => {
    // ACT
    const response = await request(app).get("/").send();

    // ASSERT
    expect(response).not.toBeOk();
    expect(response).toHaveCode(401);
  });

  it(`returns 401
      when token is invalid`, async () => {
    // ASSIGN
    jwtProvider.verify = jest.fn().mockReturnValue(undefined);

    // ACT
    const response = await request(app)
      .get("/")
      .set("Authorization", `Bearer ${INVALID_TOKEN}`);

    // ASSERT
    expect(response).not.toBeOk();
    expect(response).toHaveCode(401);
  });

  it(`returns 200 and req has user
      when valid token is provided`, async () => {
    // ASSIGN
    jwtProvider.verify = jest.fn().mockReturnValue(payload);
    userService.getById = jest.fn().mockResolvedValue(user);

    // ACT
    const response = await request(app)
      .get("/")
      .set("Authorization", `Bearer ${TOKEN}`);

    // ASSERT
    expect(response).toHaveCode(200);
    expect(response.body).toEqual({ user, ok: true });
  });
});
