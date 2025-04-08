import express from "express";
import FileLinkController from "../controllers/FileLinkController";
import { body, param } from "express-validator";
import validateRequest from "../middlewares/validators/validateRequest";

const createRouter = (
  fileLinkController: FileLinkController,
  authenticate: any
) => {
  const router = express.Router();

  router
    .get("/get/:id", authenticate, validateRequest, fileLinkController.get)
    .get(
      "/get-by-link/:link",
      authenticate,
      validateRequest,
      fileLinkController.getByLink
    )
    .post(
      "/get-or-generate",
      authenticate,
      generateChain(),
      validateRequest,
      fileLinkController.getOrGenerate
    )
    .get(
      "/download/:link",
      authenticate,
      downloadChain(),
      validateRequest,
      fileLinkController.download
    )
    .patch(
      "/add-friend",
      authenticate,
      addFriendChain(),
      validateRequest,
      fileLinkController.addFriend
    )
    .patch(
      "/remove-friend",
      authenticate,
      removeFriendChain(),
      validateRequest,
      fileLinkController.removeFriend
    )
    .patch(
      "/remove-all-friends/:id",
      authenticate,
      validateRequest,
      fileLinkController.removeAllFriends
    )
    .patch(
      "/set-publicity",
      authenticate,
      setPublicityChain(),
      validateRequest,
      fileLinkController.setPublicity
    )
    .delete(
      "/delete",
      validateRequest,
      deleteChain(),
      validateRequest,
      fileLinkController.delete
    );

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
