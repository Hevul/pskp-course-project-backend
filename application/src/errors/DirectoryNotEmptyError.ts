import ErrorCode from "./ErrorCode";

class DirectoryNotEmptyError extends Error {
  public static readonly code = ErrorCode.DirectoryIsNotEmpty;
  public static readonly message: string = "Directory is not empty!";

  constructor() {
    super(DirectoryNotEmptyError.message);
    this.name = "DirectoryNotEmptyError";
  }
}

export default DirectoryNotEmptyError;
