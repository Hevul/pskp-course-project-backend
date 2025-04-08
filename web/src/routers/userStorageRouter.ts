import express, { RequestHandler } from "express";
import UserStorageController from "../controllers/UserStorageController";
import validateRequest from "../middlewares/validators/validateRequest";
import { body, param } from "express-validator";
import userStorageErrorHandler from "../errorHandlers/handlers/userStorageErrorHandler";

const createRouter = (
  controller: UserStorageController,
  authenticate: RequestHandler
) => {
  const router = express.Router();

  router
    .get("/get/:id", getChain(), validateRequest, controller.get)
    .get("/get-all", authenticate, validateRequest, controller.getAllByUser)
    .post(
      "/create",
      createChain(),
      validateRequest,
      authenticate,
      controller.create
    )
    .patch("/rename", renameChain(), validateRequest, controller.rename)
    .delete("/delete", deleteChain(), validateRequest, controller.delete);

  router.use(userStorageErrorHandler);

  return router;
};

const getChain = () => [
  param("id").notEmpty().withMessage("Storage id must be defined!"),
];
const createChain = () => [
  body("name")
    .notEmpty()
    .withMessage("Название должно быть определенно!")
    .isLength({ max: 128 })
    .withMessage("Длина названия не должна превышать 128 символов!"),
];
const renameChain = () => [
  body("id").notEmpty().withMessage("Хранилище должно быть выбрано!"),
  body("name")
    .notEmpty()
    .withMessage("Название должно быть определенно!")
    .isLength({ max: 128 })
    .withMessage("Длина названия не должна превышать 128 символов!"),
];
const deleteChain = () => [
  body("id").notEmpty().withMessage("Хранилище должно быть выбрано!"),
];

export default createRouter;
