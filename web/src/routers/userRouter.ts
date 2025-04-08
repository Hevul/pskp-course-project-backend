import express, { RequestHandler } from "express";
import { body } from "express-validator";
import UserController from "../controllers/UserController";
import validateRequest from "../middlewares/validators/validateRequest";
import userErrorHandler from "../errorHandlers/handlers/userErrorHandler";

const createRouter = (
  controller: UserController,
  authenticate: RequestHandler
) => {
  const router = express.Router();

  router
    .get("/get", authenticate, controller.get)
    .post("/get-by-ids", authenticate, getByIdsChain(), controller.getByIds)
    .post("/register", registerChain(), validateRequest, controller.register);

  router.use(userErrorHandler);

  return router;
};

export const getByIdsChain = () => [
  body("ids").isArray().withMessage("ids должен быть массивом"),
];

const registerChain = () => [
  body("login")
    .notEmpty()
    .withMessage("Логин не может быть пустым!")
    .isLength({ min: 3, max: 20 })
    .withMessage("Длина логина должна быть от 6 до 20 символов!"),
  body("password")
    .notEmpty()
    .withMessage("Пароль не может быть пустым!")
    .isLength({ min: 6, max: 20 })
    .withMessage("Длина пароля должна быть от 6 до 20 символов!"),
];

export default createRouter;
