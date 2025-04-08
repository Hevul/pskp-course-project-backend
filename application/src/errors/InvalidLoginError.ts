import ErrorCode from "./ErrorCode";

class InvalidLoginError extends Error {
  public static readonly code = ErrorCode.InvalidLogin;
  public static readonly message: string = "Login is invalid!";

  constructor() {
    super(InvalidLoginError.message);
    this.name = "InvalidLoginError";
  }
}

export default InvalidLoginError;
