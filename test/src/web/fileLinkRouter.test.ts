import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import IFileLinkService from "../../../application/src/interfaces/IFileLinkService";
import FileLinkController from "../../../web/src/controllers/FileLinkController";
import { FileLink, User } from "../utils/imports";
import {
  ANOTHER_USER_ID,
  BUFFER,
  EMPTY_FRIENDS,
  FILE_INFO_ID,
  IS_PUBLIC,
  LINK_ID,
  LINK_LINK,
  LINK_NAME,
  LOGIN,
  PASSWORD,
  USER_ID,
} from "../utils/constants";
import createRouter from "../../../web/src/routers/linkRouter";
import extendResponse from "../../../web/src/middlewares/utils/extendResponse";
import "../utils/customMatchers";

const fileLinkService: IFileLinkService = {
  generate: jest.fn(),
  download: jest.fn(),
  addFriend: jest.fn(),
  removeFriend: jest.fn(),
};

const fileLinkController = new FileLinkController(fileLinkService);

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.user = new User(USER_ID, LOGIN, PASSWORD);
  next();
};

const router = createRouter(fileLinkController, authenticate);

const app = express();
app.use(express.json());
app.use(extendResponse);
app.use(router);

describe("Link routes", () => {
  const link = new FileLink(
    LINK_LINK,
    LINK_LINK,
    USER_ID,
    FILE_INFO_ID,
    EMPTY_FRIENDS,
    IS_PUBLIC,
    LINK_ID
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /generate", () => {
    it(`returns 201 and link
        when attempting to generate link`, async () => {
      // ASSIGN
      fileLinkService.generate = jest.fn().mockResolvedValue(link);

      // ACT
      const response = await request(app)
        .post("/generate")
        .send({ name: LINK_NAME, fileId: FILE_INFO_ID });

      // ASSERT
      expect(response).toHaveCode(201);
      expect(response.body).toEqual({ link, ok: true });
    });
  });
  describe("GET /download/:link", () => {
    it(`returns 200 and data
        when attempting to download file by link`, async () => {
      // ASSIGN
      fileLinkService.download = jest.fn().mockResolvedValue(BUFFER);

      // ACT
      const response = await request(app).get(`/download/${LINK_LINK}`);

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response.body).toEqual({
        data: { type: "Buffer", data: [...BUFFER] },
        ok: true,
      });
    });
  });
  describe("PATCH /add_friend", () => {
    it(`returns 200 and updatedLink
        when attempting to add friend to link`, async () => {
      // ASSIGN
      let updatedLink = { ...link, friends: [ANOTHER_USER_ID] };

      fileLinkService.addFriend = jest.fn().mockResolvedValue(updatedLink);

      // ACT
      const response = await request(app)
        .patch("/add_friend")
        .send({ id: link.id, ANOTHER_USER_ID });

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response.body).toEqual({ link: updatedLink, ok: true });
    });
  });
  describe("PATCH /remove_friend", () => {
    it(`returns 200 and updatedLink
      when attempting to remove friend to link`, async () => {
      // ASSIGN
      let updatedLink = { ...link, friends: [] };

      fileLinkService.removeFriend = jest.fn().mockResolvedValue(updatedLink);

      // ACT
      const response = await request(app)
        .patch("/remove_friend")
        .send({ id: link.id, ANOTHER_USER_ID });

      // ASSERT
      expect(response).toHaveCode(200);
      expect(response.body).toEqual({ link: updatedLink, ok: true });
    });
  });
});
