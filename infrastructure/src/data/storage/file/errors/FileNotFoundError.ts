import ErrorCode from "../../../ErrorCode";

class FileNotFoundError extends Error {
  public static readonly code = ErrorCode.FileNotFound;
  public static readonly message: string =
    "File was not found in a local storage";

  constructor() {
    super(FileNotFoundError.message);
    this.name = "FileNotFoundError";
  }
}

export default FileNotFoundError;
