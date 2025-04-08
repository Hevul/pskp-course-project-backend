import ErrorCode from "../../../ErrorCode";

class UserAlreadyExistsError extends Error {
  public static readonly code = ErrorCode.UserAlreadyExists;
  public static readonly message: string =
    "User with the same login already exists!";

  constructor() {
    super(UserAlreadyExistsError.message);
    this.name = "UserAlreadyExistsError";
  }
}

export default UserAlreadyExistsError;
