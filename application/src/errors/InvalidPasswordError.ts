import ErrorCode from "./ErrorCode";

class InvalidPasswordError extends Error {
  public static readonly code = ErrorCode.InvalidPassword;
  public static readonly message: string = "Password is invalid!";

  constructor() {
    super(InvalidPasswordError.message);
    this.name = "InvalidPasswordError";
  }
}

export default InvalidPasswordError;
