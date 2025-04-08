import ErrorCode from "../../../ErrorCode";

class DirectoryAlreadyExistsError extends Error {
  public static readonly code = ErrorCode.DirectoryAlreadyExists;
  public static readonly message: string =
    "Directory with the same path already exists!";

  constructor() {
    super(DirectoryAlreadyExistsError.message);
    this.name = "DirectoryAlreadyExistsError";
  }
}

export default DirectoryAlreadyExistsError;
