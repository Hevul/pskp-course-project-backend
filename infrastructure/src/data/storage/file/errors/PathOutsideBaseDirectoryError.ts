import ErrorCode from "../../../ErrorCode";

class PathOutsideBaseDirectoryError extends Error {
  public static readonly code = ErrorCode.PathOutsideBaseDirectory;
  public static readonly message: string =
    "Invalid path: Cannot access outside of the base directory";

  constructor() {
    super(PathOutsideBaseDirectoryError.message);
    this.name = "PathOutsideBaseDirectoryError";
  }
}

export default PathOutsideBaseDirectoryError;
