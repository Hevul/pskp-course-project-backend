import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import IUserStorageService from "../../../application/src/interfaces/IUserStorageService";
import UserStorageController from "../../../web/src/controllers/UserStorageController";
import extendResponse from "../../../web/src/middlewares/utils/extendResponse";
import createRouter from "../../../web/src/routers/userStorageRouter";
import "../utils/customMatchers";
import { User, UserStorage } from "../utils/imports";
import {
  LOGIN,
  PASSWORD,
  STORAGE_ID,
  STORAGE_NAME,
  USER_ID,
} from "../utils/constants";

const userStorageService: IUserStorageService = {
  create: jest.fn(),
  get: jest.fn(),
  rename: jest.fn(),
  delete: jest.fn(),
};

const userStorageController = new UserStorageController(userStorageService);

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  req.user = new User(USER_ID, LOGIN, PASSWORD);
  next();
};

const router = createRouter(userStorageController, authenticate);

const app = express();
app.use(express.json());
app.use(extendResponse);
app.use(router);

describe("UserStorage routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /create", () => {
    it(`returns 201
        when attempting to create storage`, async () => {
      // ASSIGN
      userStorageService.create = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app)
        .post("/create")
        .send({ STORAGE_NAME });

      // ASSERT
      expect(response).toHaveCode(201);
      expect(response).toBeOk();
    });
  });

  describe("GET /get/:id", () => {
    const user = new User(USER_ID, LOGIN, PASSWORD);
    const storage = new UserStorage(STORAGE_NAME, user.id, STORAGE_ID);

    it(`returns 200
        when attempting to get storage by id`, async () => {
      // ASSIGN
      userStorageService.get = jest.fn().mockResolvedValue(storage);

      // ACT
      const response = await request(app).get(`/get/${storage.id}`).send();

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response.body).toEqual({ storage, ok: true });
    });
  });

  describe("PATCH /rename", () => {
    it(`returns 200
        when attempting to rename storage`, async () => {
      // ASSIGN
      userStorageService.rename = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app)
        .patch("/rename")
        .send({ id: STORAGE_ID, name: STORAGE_NAME });

      // ASSERT
      expect(response).toBeOk();
      expect(response).toHaveCode(200);
    });
  });

  describe("DELETE /delete/:id", () => {
    it(`returns 200
        when attempting to delete storage`, async () => {
      // ASSIGN
      userStorageService.delete = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app)
        .delete(`/delete/${STORAGE_ID}`)
        .send({ force: true });

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response).toBeOk();
    });
  });
});
