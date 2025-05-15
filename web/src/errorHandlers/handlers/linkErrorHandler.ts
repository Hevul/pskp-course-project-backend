import LinkAccessDeniedError from "../../../../application/src/errors/LinkAccessDeniedError";
import CannotAddSelfAsFriendError from "../../../../core/src/errors/CannotAddSelfAsFriendError";
import DescriptionTooLongError from "../../../../core/src/errors/DescriptionTooLongError";
import FriendAlreadyAddedError from "../../../../core/src/errors/FriendAlreadyAddedError";
import NameTooLongError from "../../../../core/src/errors/NameTooLongError";
import FileLinkNotFoundError from "../../../../infrastructure/src/data/db/fileLink/errors/FileLinkNotFoundError";
import UserNotFoundError from "../../../../infrastructure/src/data/db/user/errors/UserNotFoundError";
import createErrorHandler from "../createErrorHandler";
import ErrorConfig from "../ErrorConfig";

const errorConfigs: ErrorConfig[] = [
  {
    errorName: FileLinkNotFoundError.name,
    errorDetails: {
      msg: "Ссылка для данного файла не найдена!",
      status: 404,
    },
  },
  {
    errorName: UserNotFoundError.name,
    errorDetails: {
      msg: "Пользователь не найден! Проверти вводимое имя.",
      status: 404,
    },
  },
  {
    errorName: CannotAddSelfAsFriendError.name,
    errorDetails: {
      msg: "Нельзя добавь самого себя же в список доверенных!",
    },
  },
  {
    errorName: FriendAlreadyAddedError.name,
    errorDetails: {
      msg: "Пользователь уже добавлен в список доверенных!",
    },
  },
  {
    errorName: LinkAccessDeniedError.name,
    errorDetails: {
      msg: "Доступ к ссылке запрещён!",
      status: 403,
    },
  },
  {
    errorName: NameTooLongError.name,
    errorDetails: {
      msg: "Длина имени не может быть более 128 символов!",
      path: "description",
    },
  },
  {
    errorName: DescriptionTooLongError.name,
    errorDetails: {
      msg: "Длина описания не может быть более 128 символов!",
      path: "description",
    },
  },
];

const linkErrorHandler = createErrorHandler(errorConfigs);

export default linkErrorHandler;
