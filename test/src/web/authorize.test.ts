import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import authorize from "../../../web/src/middlewares/utils/authorize";
import extendResponse from "../../../web/src/middlewares/utils/extendResponse";
import { User } from "../utils/imports";
import { LOGIN, PASSWORD, USER_ID } from "../utils/constants";
import "../utils/customMatchers";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  req.user = new User(USER_ID, LOGIN, PASSWORD);
  next();
};

describe("Authorize middleware", () => {
  const createAppWithAuthorize = (haveAccess: any) => {
    const app = express();

    app.use(express.json());
    app.use(extendResponse);
    app.use(authenticate);
    app.use(authorize(haveAccess));
    app.get("/", (req, res) => res.good());

    return app;
  };

  it(`returns 403
      when access denied`, async () => {
    // ASSIGN
    const app = createAppWithAuthorize(jest.fn().mockResolvedValue(false));

    // ACT
    const response = await request(app).get("/").send();

    // ASSERT
    expect(response).not.toBeOk();
    expect(response).toHaveCode(403);
  });

  it(`returns 200
      when access allowed`, async () => {
    // ASSIGN
    const app = createAppWithAuthorize(jest.fn().mockResolvedValue(true));

    // ACT
    const response = await request(app).get("/").send();

    // ASSERT
    expect(response).toBeOk();
    expect(response).toHaveCode(200);
  });
});
