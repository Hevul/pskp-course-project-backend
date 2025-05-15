import UserAlreadyRegisteredError from "../../../../application/src/errors/UserAlreadyRegisteredError";
import CanNotBeEmptyError from "../../../../core/src/errors/CanNotBeEmptyError";
import LineTooLongError from "../../../../core/src/errors/LineTooLongError";
import createErrorHandler from "../createErrorHandler";
import ErrorConfig from "../ErrorConfig";

const errorConfigs: ErrorConfig[] = [
  {
    errorName: UserAlreadyRegisteredError.name,
    errorDetails: {
      msg: "Пользователь с таким логином уже зарегистрирован! Придумайте другой логин.",
      path: "login",
    },
  },
  {
    errorName: LineTooLongError.name,
    errorDetails: {
      msg: "Длина строки слишком коротка!",
    },
  },
  {
    errorName: CanNotBeEmptyError.name,
    errorDetails: {
      msg: "Строка не может быть пустой!",
    },
  },
];

const userErrorHandler = createErrorHandler(errorConfigs);

export default userErrorHandler;
