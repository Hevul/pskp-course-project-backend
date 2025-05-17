import CopyCollisionError from "../../../../application/src/errors/CopyCollisionError";
import CreateCollisionError from "../../../../application/src/errors/CreateCollisionError";
import DirectoryMoveInChildError from "../../../../application/src/errors/DirectoryMoveInChildError";
import DirectoryMoveInItSelfError from "../../../../application/src/errors/DirectoryMoveInItSelfError";
import MoveCollisionError from "../../../../application/src/errors/MoveCollisionError";
import RenameCollisionError from "../../../../application/src/errors/RenameCollisionError";
import SameDestinationError from "../../../../application/src/errors/SameDestinationError";
import DirectoryNameEndsWithDotError from "../../../../core/src/errors/DirectoryNameEndsWithDotError";
import EmptyFileNameError from "../../../../core/src/errors/EmptyFileNameError";
import ForbiddenCharactersError from "../../../../core/src/errors/ForbiddenCharactersError";
import InvalidDirectoryCharactersError from "../../../../core/src/errors/InvalidDirectoryCharactersError";
import LeadingTrailingSpacesError from "../../../../core/src/errors/LeadingTrailingSpacesError";
import NameTooLongError from "../../../../core/src/errors/NameTooLongError";
import NonPrintableCharactersError from "../../../../core/src/errors/NonPrintableCharactersError";
import ReservedNameError from "../../../../core/src/errors/ReservedNameError";
import DirInfoAlreadyExistsError from "../../../../infrastructure/src/data/db/dirInfo/errors/DirInfoAlreadyExistsError";
import createErrorHandler from "../createErrorHandler";
import ErrorConfig from "../ErrorConfig";

const nameValidation: ErrorConfig[] = [
  {
    errorName: EmptyFileNameError.name,
    errorDetails: {
      msg: "Имя файла не может быть пустым!",
      path: "name",
    },
  },
  {
    errorName: NameTooLongError.name,
    errorDetails: {
      msg: "Имя файла не может превышать 255 символов!",
      path: "name",
    },
  },
  {
    errorName: ForbiddenCharactersError.name,
    errorDetails: {
      msg: "Имя содержит запрещённые символы!",
      path: "name",
    },
  },
  {
    errorName: ReservedNameError.name,
    errorDetails: {
      msg: "Введённое имя является зарезервированным именем!",
      path: "name",
    },
  },
  {
    errorName: NonPrintableCharactersError.name,
    errorDetails: {
      msg: "Имя содержит непечатаемые символы!",
      path: "name",
    },
  },
  {
    errorName: LeadingTrailingSpacesError.name,
    errorDetails: {
      msg: "Имя не должно начинаться или заканчиваться пробелами!",
      path: "name",
    },
  },
  {
    errorName: DirectoryNameEndsWithDotError.name,
    errorDetails: {
      msg: "Имя директории не должно заканчиваться точкой!",
      path: "name",
    },
  },
  {
    errorName: InvalidDirectoryCharactersError.name,
    errorDetails: {
      msg: "Имя директории содержит недопустимые символы!",
      path: "name",
    },
  },
];

const operations: ErrorConfig[] = [
  {
    errorName: CreateCollisionError.name,
    errorDetails: {
      msg: "В текущей папке уже есть папка с таким же именем! Выберите другое имя.",
      path: "name",
    },
  },
  {
    errorName: DirectoryMoveInChildError.name,
    errorDetails: {
      msg: "Невозможно переместить папку в одну из её дочерних папок!",
    },
  },
  {
    errorName: DirectoryMoveInItSelfError.name,
    errorDetails: {
      msg: "Невозможно переместить папку в себя же!",
    },
  },
  {
    errorName: MoveCollisionError.name,
    errorDetails: {
      msg: "Папка с таким же именем уже существует в выбранной папке!",
    },
  },
  {
    errorName: RenameCollisionError.name,
    errorDetails: {
      msg: "Папка с таким же именем уже существует в выбранной папке!",
    },
  },
  {
    errorName: CopyCollisionError.name,
    errorDetails: {
      msg: "Папка с таким же именем уже существует в выбранной папке!",
    },
  },
  {
    errorName: SameDestinationError.name,
    errorDetails: {
      msg: "Нельзя переместить или скопировать папку, в ту же папку, где он уже находиться!",
    },
  },
];

const errorConfigs: ErrorConfig[] = [...nameValidation, ...operations];

const dirInfoErrorHandler = createErrorHandler(errorConfigs);

export default dirInfoErrorHandler;
