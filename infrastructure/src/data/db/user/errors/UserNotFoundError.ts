import ErrorCode from "../../../ErrorCode";

class UserNotFoundError extends Error {
  public static readonly code = ErrorCode.UserNotFound;
  public static readonly message: string =
    "Object of User was not found in data base!";

  constructor() {
    super(UserNotFoundError.message);
    this.name = "UserNotFoundError";
  }
}

export default UserNotFoundError;
