import ErrorCode from "./ErrorCode";

class UserAlreadyRegisteredError extends Error {
  public static readonly code = ErrorCode.UserAlreadyRegistered;
  public static readonly message: string =
    "User with the same login is already registered!";

  constructor() {
    super(UserAlreadyRegisteredError.message);
    this.name = "UserAlreadyRegisteredError";
  }
}

export default UserAlreadyRegisteredError;
