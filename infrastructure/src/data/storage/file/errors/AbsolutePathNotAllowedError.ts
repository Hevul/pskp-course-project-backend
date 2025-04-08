import ErrorCode from "../../../ErrorCode";

class AbsolutePathNotAllowedError extends Error {
  public static readonly code = ErrorCode.AbsolutePathNotAllowed;
  public static readonly message: string =
    "Invalid path: Absolute paths are not allowed";

  constructor() {
    super(AbsolutePathNotAllowedError.message);
    this.name = "AbsolutePathNotAllowedError";
  }
}

export default AbsolutePathNotAllowedError;
