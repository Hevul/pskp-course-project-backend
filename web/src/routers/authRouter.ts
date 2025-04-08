import express, { RequestHandler } from "express";
import { body } from "express-validator";
import validateRequest from "../middlewares/validators/validateRequest";
import AuthController from "../controllers/AuthController";
import authErrorHandler from "../errorHandlers/handlers/authErrorHandler";

const createRouter = (
  controller: AuthController,
  authenticate: RequestHandler
) => {
  const router = express.Router();

  router
    .post("/login", loginChain(), validateRequest, controller.login)
    .post("/logout", authenticate, controller.logout)
    .get("/check-auth", controller.checkAuth);

  router.use(authErrorHandler);

  return router;
};

const loginChain = () => [
  body("login").notEmpty().withMessage("Логин не может быть пустым!"),
  body("password").notEmpty().withMessage("Пароль не может быть пустым!"),
];

export default createRouter;
