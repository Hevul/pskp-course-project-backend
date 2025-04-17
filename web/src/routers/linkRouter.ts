import express, { RequestHandler } from "express";
import FileLinkController from "../controllers/FileLinkController";
import { body, param } from "express-validator";
import validateRequest from "../middlewares/validators/validateRequest";
import { createAuthorizeMiddlewareFactory } from "../middlewares/utils/createAuthorizeMiddlewareFactory";
import linkErrorHandler from "../errorHandlers/handlers/linkErrorHandler";

const createRouter = (
  authenticate: RequestHandler,
  authorize: ReturnType<typeof createAuthorizeMiddlewareFactory>,
  fileLinkController: FileLinkController
) => {
  const router = express.Router();

  router
    .get(
      "/get/:id",
      authenticate,
      authorize({
        entityTypes: {
          id: "link",
        },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      validateRequest,
      fileLinkController.get
    )
    .get(
      "/get-by-fileinfo-id/:id",
      authenticate,
      authorize({
        entityTypes: { id: "file" },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      fileLinkController.getByFileInfoId
    )
    .get("/get-all-by-owner", authenticate, fileLinkController.getAllByOwner)
    .get(
      "/get-by-link/:link",
      authenticate,
      // ОЁЙ
      validateRequest,
      fileLinkController.getByLink
    )
    .get(
      "/download/:link",
      authenticate,
      // БЕДА
      downloadChain(),
      validateRequest,
      fileLinkController.download
    )
    .patch(
      "/add-friend",
      authenticate,
      authorize({
        entityTypes: {
          id: "link",
        },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      addFriendChain(),
      validateRequest,
      fileLinkController.addFriend
    )
    .post(
      "/create",
      authenticate,
      authorize({
        entityTypes: { id: "file" },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      fileLinkController.create
    )
    .patch(
      "/remove-friend",
      authenticate,
      authorize({
        entityTypes: {
          id: "link",
        },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      removeFriendChain(),
      validateRequest,
      fileLinkController.removeFriend
    )
    .patch(
      "/remove-all-friends/:id",
      authenticate,
      authorize({
        entityTypes: {
          id: "link",
        },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      fileLinkController.removeAllFriends
    )
    .patch(
      "/set-publicity",
      authenticate,
      authorize({
        entityTypes: {
          id: "link",
        },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      setPublicityChain(),
      validateRequest,
      fileLinkController.setPublicity
    )
    .delete(
      "/delete",
      authenticate,
      authorize({
        entityTypes: {
          id: "link",
        },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      validateRequest,
      deleteChain(),
      validateRequest,
      fileLinkController.delete
    );

  router.use(linkErrorHandler);

  return router;
};

const generateChain = () => [
  body("fileId").notEmpty().withMessage("Файл должен быть выбран!"),
];
const downloadChain = () => [
  param("link").notEmpty().withMessage("Ссылка на файл должна быть указана!"),
];
const addFriendChain = () => [
  body("id").notEmpty().withMessage("Ссылка должна быть выбрана!"),
  body("friendName").notEmpty().withMessage("Пользователь должен быть указан!"),
];
const removeFriendChain = () => [
  body("id").notEmpty().withMessage("Ссылка должна быть выбрана!"),
  body("friendId").notEmpty().withMessage("Пользователь должен быть указан!"),
];
const setPublicityChain = () => [
  body("id").notEmpty().withMessage("Ссылка должна быть выбрана!"),
  body("publicity")
    .notEmpty()
    .withMessage("Статус публичности должен быть выбран!"),
];
const deleteChain = () => [
  body("id").notEmpty().withMessage("Ссылка на файл должна быть определена!"),
];

export default createRouter;
