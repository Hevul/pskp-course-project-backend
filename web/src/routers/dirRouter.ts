import express, { RequestHandler } from "express";
import DirController from "../controllers/DirController";
import validateRequest from "../middlewares/validators/validateRequest";
import { body, param } from "express-validator";
import dirInfoErrorHandler from "../errorHandlers/handlers/dirInfoErrorHandler";
import { createAuthorizeMiddlewareFactory } from "../middlewares/utils/createAuthorizeMiddlewareFactory";

const createRouter = (
  authenticate: RequestHandler,
  authorize: ReturnType<typeof createAuthorizeMiddlewareFactory>,
  dirController: DirController
) => {
  const router = express.Router();

  router
    .get(
      "/get-all-by-storage/:storageId/:parentId?",
      authenticate,
      authorize({
        entityTypes: {
          storageId: "storage",
        },
        idLocations: ["params"],
        idFields: ["storageId"],
      }),
      getByStorageChain(),
      validateRequest,
      dirController.getAllByStorageId
    )
    .get(
      "/get-full-info/:id",
      authenticate,
      authorize({
        entityTypes: {
          id: "dir",
        },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      dirController.getFullInfo
    )
    .post(
      "/create",
      authenticate,
      authorize({
        entityTypes: {
          storageId: "storage",
        },
        idLocations: ["body"],
        idFields: ["storageId"],
      }),
      createChain(),
      validateRequest,
      dirController.create
    )
    .delete(
      "/delete",
      authenticate,
      authorize({
        entityTypes: {
          id: "dir",
        },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      deleteChain(),
      validateRequest,
      dirController.delete
    )
    .post(
      "/copy",
      authenticate,
      authorize({
        entityTypes: {
          id: "dir",
          parentId: "dir",
        },
        idLocations: ["body"],
        idFields: ["id", "parentId"],
      }),
      copyChain(),
      validateRequest,
      dirController.copy
    )
    .put(
      "/move",
      authenticate,
      authorize({
        entityTypes: {
          id: "dir",
          parentId: "dir",
        },
        idLocations: ["body"],
        idFields: ["id", "parentId"],
      }),
      copyChain(),
      validateRequest,
      dirController.move
    )
    .patch(
      "/rename",
      authenticate,
      authorize({
        entityTypes: {
          id: "dir",
        },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      renameChain(),
      validateRequest,
      dirController.rename
    );

  router.use(dirInfoErrorHandler);

  return router;
};

const getByStorageChain = () => [
  param("storageId").notEmpty().withMessage("Хранилище должно быть выбрано!"),
  param("parentId").optional(),
];
const copyChain = () => [
  body("id").notEmpty().withMessage("File id must be defined!"),
  body("parentId").optional(),
];
const deleteChain = () => [];
const createChain = () => [
  body("name").notEmpty().withMessage("Название не может быть пустым!"),
  body("storageId").notEmpty().withMessage("Хранилище должно быть выбрано!"),
];
const renameChain = () => [
  body("id").notEmpty().withMessage("Файл должен быть определён!"),
  body("name").notEmpty().withMessage("Название не может быть пустым!"),
];

export default createRouter;
