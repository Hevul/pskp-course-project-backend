import ErrorCode from "../../../ErrorCode";

class InvalidCharsInPathError extends Error {
  public static readonly code = ErrorCode.InvalidCharsInPath;
  public static readonly message: string =
    "Invalid path: Contains invalid characters";

  constructor() {
    super(InvalidCharsInPathError.message);
    this.name = "InvalidCharsInPathError";
  }
}

export default InvalidCharsInPathError;
