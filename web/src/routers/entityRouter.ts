import express, { RequestHandler } from "express";
import EntityController from "../controllers/EntityController";
import { createAuthorizeMiddlewareFactory } from "../middlewares/utils/createAuthorizeMiddlewareFactory";
import entityErrorHandler from "../errorHandlers/handlers/entityErrorHandler";

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
    )
    .post(
      "/copy-multiple",
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
      controller.copyMultiple
    );

  router.use(entityErrorHandler);

  return router;
};

export default createRouter;
