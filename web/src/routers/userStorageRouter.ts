import express, { RequestHandler } from "express";
import UserStorageController from "../controllers/UserStorageController";
import validateRequest from "../middlewares/validators/validateRequest";
import { body, param } from "express-validator";
import userStorageErrorHandler from "../errorHandlers/handlers/userStorageErrorHandler";
import { createAuthorizeMiddlewareFactory } from "../middlewares/utils/createAuthorizeMiddlewareFactory";

const createRouter = (
  authenticate: RequestHandler,
  authorize: ReturnType<typeof createAuthorizeMiddlewareFactory>,
  controller: UserStorageController
) => {
  const router = express.Router();

  router
    .get(
      "/get/:id",
      authenticate,
      authorize({
        entityTypes: { id: "storage" },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      getChain(),
      validateRequest,
      controller.get
    )
    .get(
      "/get-full-info/:id",
      authenticate,
      authorize({
        entityTypes: { id: "storage" },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      controller.getFullInfo
    )
    .get("/get-all", authenticate, validateRequest, controller.getAllByUser)
    .post(
      "/create",
      authenticate,
      createChain(),
      validateRequest,
      controller.create
    )
    .put(
      "/rename",
      authenticate,
      authorize({
        entityTypes: { id: "storage" },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      renameChain(),
      validateRequest,
      controller.rename
    )
    .delete(
      "/delete",
      authenticate,
      authorize({
        entityTypes: { id: "storage" },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      deleteChain(),
      validateRequest,
      controller.delete
    );

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
