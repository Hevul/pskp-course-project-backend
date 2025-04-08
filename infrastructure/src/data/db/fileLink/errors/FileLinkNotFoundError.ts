import ErrorCode from "../../../ErrorCode";

class FileLinkNotFoundError extends Error {
  public static readonly code = ErrorCode.FileLinkNotFound;
  public static readonly message: string =
    "Object of FileLink was not found in data base!";

  constructor() {
    super(FileLinkNotFoundError.message);
    this.name = "FileLinkNotFoundError";
  }
}

export default FileLinkNotFoundError;
