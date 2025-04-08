import express, { RequestHandler } from "express";
import DirController from "../controllers/DirController";
import validateRequest from "../middlewares/validators/validateRequest";
import { body, param } from "express-validator";
import dirInfoErrorHandler from "../errorHandlers/handlers/dirInfoErrorHandler";

const createRouter = (
  authenticate: RequestHandler,
  dirController: DirController
) => {
  const router = express.Router();

  router
    .get(
      "/get-all-by-storage/:storageId/:parentId?",
      getByStorageChain(),
      validateRequest,
      dirController.getAllByStorageId
    )
    .post("/create", createChain(), validateRequest, dirController.create)
    .delete("/delete", dirController.delete)
    .post("/copy", copyChain(), validateRequest, dirController.copy)
    .put("/move", copyChain(), validateRequest, dirController.move)
    .patch("/rename", renameChain(), validateRequest, dirController.rename);

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
const createChain = () => [
  body("name").notEmpty().withMessage("Название не может быть пустым!"),
  body("storageId").notEmpty().withMessage("Хранилище должно быть выбрано!"),
];
const renameChain = () => [
  body("id").notEmpty().withMessage("Файл должен быть определён!"),
  body("name").notEmpty().withMessage("Название не может быть пустым!"),
];

export default createRouter;
