import ErrorCode from "../../../ErrorCode";

class FileLinkAlreadyExistsError extends Error {
  public static readonly code = ErrorCode.FileLinkAlreadyExists;
  public static readonly message: string =
    "FileLink with the same link already exists!";

  constructor() {
    super(FileLinkAlreadyExistsError.message);
    this.name = "FileLinkAlreadyExistsError";
  }
}

export default FileLinkAlreadyExistsError;
