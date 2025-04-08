import ErrorCode from "../../../ErrorCode";

class FileInfoAlreadyExistsError extends Error {
  public static readonly code = ErrorCode.FileInfoAlreadyExists;
  public static readonly message: string =
    "FileInfo with the same pathname already exists!";

  constructor() {
    super(FileInfoAlreadyExistsError.message);
    this.name = "FileInfoAlreadyExistsError";
  }
}

export default FileInfoAlreadyExistsError;
