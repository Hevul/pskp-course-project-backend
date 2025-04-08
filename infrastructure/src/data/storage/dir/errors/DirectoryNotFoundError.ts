import ErrorCode from "../../../ErrorCode";

class DirectoryNotFoundError extends Error {
  public static readonly code = ErrorCode.DirectoryNotFound;
  public static readonly message: string =
    "Directory doesn't exist in a storage!";

  constructor() {
    super(DirectoryNotFoundError.message);
    this.name = "DirectoryNotFoundError";
  }
}

export default DirectoryNotFoundError;
