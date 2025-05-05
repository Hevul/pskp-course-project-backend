import express, { RequestHandler } from "express";
import EntityController from "../controllers/EntityController";
import { createAuthorizeMiddlewareFactory } from "../middlewares/utils/createAuthorizeMiddlewareFactory";

const createRouter = (
  controller: EntityController,
  authorize: ReturnType<typeof createAuthorizeMiddlewareFactory>,
  authenticate: RequestHandler
) => {
  const router = express.Router();

  router
    .get(
      "/download-many/",
      authenticate,
      authorize({
        entityTypes: {
          fileIds: "file",
          dirIds: "dir",
        },
        idLocations: ["query"],
        idFields: ["fileIds", "dirIds"],
      }),
      controller.downloadMany
    )
    .put(
      "/move-multiple",
      authenticate,
      authorize({
        entityTypes: {
          fileIds: "file",
          dirIds: "dir",
          destinationId: "dir",
        },
        idLocations: ["body"],
        idFields: ["fileIds", "dirIds", "destinationId"],
      }),
      controller.moveMultiple
    );

  return router;
};

export default createRouter;
