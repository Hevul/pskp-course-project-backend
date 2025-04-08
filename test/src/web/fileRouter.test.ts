import request from "supertest";
import express, { NextFunction } from "express";
import FileController from "../../../web/src/controllers/FileController";
import createRouter from "../../../web/src/routers/fileRouter";
import IFileService from "../../../application/src/interfaces/IFileService";
import "../utils/customMatchers";
import { BUFFER, DIR_ID, FILE_NAME, STORAGE_ID } from "../utils/constants";
import extendResponse from "../../../web/src/middlewares/utils/extendResponse";
import { FileInfo } from "../utils/imports";

const fileService: IFileService = {
  upload: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
  overwrite: jest.fn(),
  copy: jest.fn(),
  move: jest.fn(),
  rename: jest.fn(),
  get: jest.fn(),
  getAllByStorageId: jest.fn(),
};

const authenticate = (req: any, res: Response, next: NextFunction) => {
  next();
};

const authorize = (req: any, res: Response, next: NextFunction) => {
  next();
};

const fileController = new FileController(fileService);
const router = createRouter(fileController);

const app = express();
app.use(express.json());
app.use(extendResponse);
app.use(router);

describe("File routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /upload", () => {
    const sendRequest = async () => {
      return request(app)
        .post("/upload")
        .field("storageId", STORAGE_ID)
        .field("parentId", DIR_ID)
        .attach(
          "file",
          "/home/vlad/projects/project-casio/backend/test/src/web/test.txt"
        );
    };

    it(`returns 200
        when attempting to upload file`, async () => {
      // ASSIGN
      fileService.upload = jest.fn().mockResolvedValue({});

      // ACT
      const response = await sendRequest();

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response.body).toEqual({ message: "File is uploaded", ok: true });
    });

    it(`returns 400
        when attempting to upload file without file`, async () => {
      // ACT
      const response = await request(app)
        .post("/upload")
        .field("storageId", STORAGE_ID)
        .field("parentId", DIR_ID);

      // ASSERT
      expect(response).toHaveCode(400);
      expect(response.body).toEqual({
        message: "Can not find file in request",
        ok: false,
      });
    });
  });

  describe("GET /download/:id", () => {
    it(`returns 200
        when attempting to download own file`, async () => {
      // ASSIGN
      fileService.download = jest.fn().mockResolvedValue(BUFFER);

      // ACT
      const response = await request(app).get("/download/1").send();

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response.body).toEqual({
        data: { type: "Buffer", data: [...BUFFER] },
        ok: true,
      });
    });
  });

  describe("DELETE /delete/:id", () => {
    it(`returns 200
        when attempting to delete file`, async () => {
      // ASSIGN
      fileService.delete = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app).delete("/delete/1").send();

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response).toBeOk();
    });
  });

  describe("PUT /update/:id", () => {
    it(`returns 200
        when attempting to update file`, async () => {
      // ASSIGN
      fileService.overwrite = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app)
        .put("/update/1")
        .attach(
          "file",
          "/home/vlad/projects/project-casio/backend/test/src/web/test.txt"
        );

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response).toBeOk();
    });
  });

  describe("POST /copy/:id", () => {
    it(`returns 200
        when attempting to copy file`, async () => {
      // ASSIGN
      fileService.copy = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app)
        .post("/copy/1")
        .send({ parentId: DIR_ID });

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response).toBeOk();
    });
  });

  describe("PUT /move/:id", () => {
    it(`returns 200
      when attempting to move file`, async () => {
      // ASSIGN
      fileService.move = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app)
        .put("/move/1")
        .send({ parentId: DIR_ID });

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response).toBeOk();
    });
  });

  describe("PATCH /rename/:id", () => {
    it(`returns 200
        when attempting to rename file`, async () => {
      // ASSIGN
      fileService.rename = jest.fn().mockResolvedValue({});

      // ACT
      const response = await request(app)
        .patch("/rename/1")
        .send({ name: FILE_NAME });

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response).toBeOk();
    });
  });
});
