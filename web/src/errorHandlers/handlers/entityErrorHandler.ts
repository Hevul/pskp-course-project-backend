import CopyCollisionError from "../../../../application/src/errors/CopyCollisionError";
import DirectoryMoveInChildError from "../../../../application/src/errors/DirectoryMoveInChildError";
import DirectoryMoveInItSelfError from "../../../../application/src/errors/DirectoryMoveInItSelfError";
import MoveCollisionError from "../../../../application/src/errors/MoveCollisionError";
import SameDestinationError from "../../../../application/src/errors/SameDestinationError";
import createErrorHandler from "../createErrorHandler";
import ErrorConfig from "../ErrorConfig";

const errorConfigs: ErrorConfig[] = [
  {
    errorName: SameDestinationError.name,
    errorDetails: {
      msg: "Нельзя переместить или скопировать объекты, в ту же папку, где они уже находиться!",
    },
  },
  {
    errorName: CopyCollisionError.name,
    errorDetails: {
      msg: "Объекты с таким же именем уже существуют в выбранной папке!",
    },
  },
  {
    errorName: DirectoryMoveInChildError.name,
    errorDetails: {
      msg: "Невозможно переместить или скопировать папку в одну из её дочерних папок!",
    },
  },
  {
    errorName: DirectoryMoveInItSelfError.name,
    errorDetails: {
      msg: "Невозможно переместить или скопировать папку в себя же!",
    },
  },
  {
    errorName: MoveCollisionError.name,
    errorDetails: {
      msg: "Объект с таким же именем уже существует в выбранной папке!",
    },
  },
];

const entityErrorHandler = createErrorHandler(errorConfigs);

export default entityErrorHandler;
