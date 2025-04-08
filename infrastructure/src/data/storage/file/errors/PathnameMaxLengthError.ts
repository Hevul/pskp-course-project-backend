import ErrorCode from "../../../ErrorCode";

class PathnameMaxLengthError extends Error {
  public static readonly code = ErrorCode.PathnameMaxLength;
  public static readonly message: string = "Path cannot be too long!";

  constructor() {
    super(PathnameMaxLengthError.message);
    this.name = "AbsolutePathNotAllowedError";
  }
}

export default PathnameMaxLengthError;
