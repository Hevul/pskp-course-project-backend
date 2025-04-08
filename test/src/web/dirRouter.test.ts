import request from "supertest";
import express from "express";
import IDirService from "../../../application/src/interfaces/IDirService";
import DirController from "../../../web/src/controllers/DirController";
import createRouter from "../../../web/src/routers/dirRouter";
import extendResponse from "../../../web/src/middlewares/utils/extendResponse";
import { DIR_ID, DIR_NAME, STORAGE_ID } from "../utils/constants";
import "../utils/customMatchers";

const dirService: IDirService = {
  create: jest.fn(),
  delete: jest.fn(),
  rename: jest.fn(),
  getSize: jest.fn(),
  copy: jest.fn(),
  move: jest.fn(),
};

const dirController = new DirController(dirService);
const router = createRouter(dirController);

const app = express();
app.use(express.json());
app.use(extendResponse);
app.use(router);

describe("Dir routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /create", () => {
    it(`returns 200
        when attempting to create dir`, async () => {
      // ASSIGN
      dirService.create = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app)
        .post("/create")
        .send({ name: DIR_NAME, storageId: STORAGE_ID, parentId: DIR_ID });

      // ASSERT
      expect(response).toBeOk();
      expect(response).toHaveCode(200);
    });
  });
  describe("DELETE /delete/:id", () => {
    it(`returns 200
        when attempting to delete dir`, async () => {
      // ASSIGN
      dirService.delete = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app).delete("/delete/1").send();

      // ASSERT
      expect(response).toBeOk();
      expect(response).toHaveCode(200);
    });
  });
  describe("POST /copy/:id", () => {
    it(`returns 200
        when attempting to copy dir`, async () => {
      // ASSIGN
      dirService.copy = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app).post("/copy/1").send();

      // ASSERT
      expect(response).toBeOk();
      expect(response).toHaveCode(200);
    });
  });
  describe("PUT /move/:id", () => {
    it(`returns 200
        when attempting to move dir`, async () => {
      // ASSIGN
      dirService.move = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app).put("/move/1").send();

      // ASSERT
      expect(response).toBeOk();
      expect(response).toHaveCode(200);
    });
  });
  describe("PATCH /rename/:id", () => {
    it(`returns 200
        when attempting to rename dir`, async () => {
      // ASSIGN
      dirService.rename = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app).put("/move/1").send();

      // ASSERT
      expect(response).toBeOk();
      expect(response).toHaveCode(200);
    });
  });
});
