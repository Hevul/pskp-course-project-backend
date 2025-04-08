import ErrorCode from "../../../ErrorCode";

class FileInfoNotFoundError extends Error {
  public static readonly code = ErrorCode.FileInfoNotFound;
  public static readonly message: string =
    "Object of FileInfo was not found in data base!";

  constructor() {
    super(FileInfoNotFoundError.message);
    this.name = "FileInfoNotFoundError";
  }
}

export default FileInfoNotFoundError;
