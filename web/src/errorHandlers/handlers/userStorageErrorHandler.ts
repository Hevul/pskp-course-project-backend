import UserStorageNotFoundError from "../../../../infrastructure/src/data/db/userStorage/errors/UserStorageNotFoundError";
import UserStorageAlreadyExistsError from "../../../../infrastructure/src/data/db/userStorage/errors/UserStorageAlreadyExistsError";
import createErrorHandler from "../createErrorHandler";
import ErrorConfig from "../ErrorConfig";

const errorConfigs: ErrorConfig[] = [
  {
    errorName: UserStorageNotFoundError.name,
    errorDetails: {
      msg: "Хранилище должно быть выбрано!",
      path: "id",
    },
  },
  {
    errorName: UserStorageAlreadyExistsError.name,
    errorDetails: {
      msg: "Хранилище с таким же названием уже создано. Выберите другое название!",
      path: "name",
    },
  },
];

const userStorageErrorHandler = createErrorHandler(errorConfigs);

export default userStorageErrorHandler;
