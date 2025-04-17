import InvalidLoginError from "../../../../application/src/errors/InvalidLoginError";
import InvalidPasswordError from "../../../../application/src/errors/InvalidPasswordError";
import createErrorHandler from "../createErrorHandler";
import ErrorConfig from "../ErrorConfig";

const errorConfigs: ErrorConfig[] = [
  {
    errorName: InvalidLoginError.name,
    errorDetails: {
      msg: "Неверный логин! Пожалуйста, попробуйте ещё раз.",
      path: "login",
    },
  },
  {
    errorName: InvalidPasswordError.name,
    errorDetails: {
      msg: "Неверный пароль! Пожалуйста, попробуйте ещё раз.",
      path: "password",
    },
  },
];

const authErrorHandler = createErrorHandler(errorConfigs);

export default authErrorHandler;
