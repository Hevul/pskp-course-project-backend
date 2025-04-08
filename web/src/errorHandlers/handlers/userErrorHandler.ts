import UserAlreadyRegisteredError from "../../../../application/src/errors/UserAlreadyRegisteredError";
import createErrorHandler from "../createErrorHandler";
import ErrorConfig from "../ErrorConfig";

const errorConfigs: ErrorConfig[] = [
  {
    errorName: UserAlreadyRegisteredError.name,
    errorDetails: {
      value: "",
      msg: "Пользователь с таким логином уже зарегистрирован! Придумайте другой логин.",
      path: "login",
    },
  },
];

const userErrorHandler = createErrorHandler(errorConfigs);

export default userErrorHandler;
