import ErrorCode from "../../../ErrorCode";

class FileAlreadyExistsError extends Error {
  public static readonly code = ErrorCode.FileInfoAlreadyExists;
  public static readonly message: string =
    "File with the same pathname already exists!";

  constructor() {
    super(FileAlreadyExistsError.message);
    this.name = "FileAlreadyExistsError";
  }
}

export default FileAlreadyExistsError;
