import CopyCollisionError from "../../../../application/src/errors/CopyCollisionError";
import CreateCollisionError from "../../../../application/src/errors/CreateCollisionError";
import DirectoryMoveInChildError from "../../../../application/src/errors/DirectoryMoveInChildError";
import MoveCollisionError from "../../../../application/src/errors/MoveCollisionError";
import RenameCollisionError from "../../../../application/src/errors/RenameCollisionError";
import SameDestinationError from "../../../../application/src/errors/SameDestinationError";
import EmptyFileNameError from "../../../../core/src/errors/EmptyFileNameError";
import ForbiddenCharactersError from "../../../../core/src/errors/ForbiddenCharactersError";
import LeadingTrailingSpacesError from "../../../../core/src/errors/LeadingTrailingSpacesError";
import NameTooLongError from "../../../../core/src/errors/NameTooLongError";
import NonPrintableCharactersError from "../../../../core/src/errors/NonPrintableCharactersError";
import ReservedNameError from "../../../../core/src/errors/ReservedNameError";
import FileInfoAlreadyExistsError from "../../../../infrastructure/src/data/db/fileInfo/errors/FileInfoAlreadyExistsError";
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
];

const operations: ErrorConfig[] = [
  {
    errorName: MoveCollisionError.name,
    errorDetails: {
      msg: "Файл с таким же именем уже существует в выбранной папке!",
    },
  },
  {
    errorName: RenameCollisionError.name,
    errorDetails: {
      msg: "Файл с таким же именем уже существует в выбранной папке!",
    },
  },
  {
    errorName: CopyCollisionError.name,
    errorDetails: {
      msg: "Файл с таким же именем уже существует в выбранной папке!",
    },
  },
  {
    errorName: CreateCollisionError.name,
    errorDetails: {
      msg: "Файл с таким же именем уже существует в выбранной папке!",
      path: "upload",
    },
  },
  {
    errorName: SameDestinationError.name,
    errorDetails: {
      msg: "Нельзя переместить или скопировать файл, в ту же папку, где он уже находиться!",
    },
  },
];

const errorConfigs: ErrorConfig[] = [...nameValidation, ...operations];

const fileInfoErrorHandler = createErrorHandler(errorConfigs);

export default fileInfoErrorHandler;
