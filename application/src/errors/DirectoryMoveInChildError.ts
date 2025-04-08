import ErrorCode from "./ErrorCode";

class DirectoryMoveInChildError extends Error {
  public static readonly code = ErrorCode.DirectoryMove;
  public static readonly message: string =
    "Cannot move a directory into one of its subdirectories!";

  constructor() {
    super(DirectoryMoveInChildError.message);
    this.name = "DirectoryMoveInChildError";
  }
}

export default DirectoryMoveInChildError;
