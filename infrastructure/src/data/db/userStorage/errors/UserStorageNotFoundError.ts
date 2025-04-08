import ErrorCode from "../../../ErrorCode";

class UserStorageNotFoundError extends Error {
  public static readonly code = ErrorCode.UserStorageNotFound;
  public static readonly message: string =
    "Object of UserStorage was not found in data base!";

  constructor() {
    super(UserStorageNotFoundError.message);
    this.name = "UserStorageNotFoundError";
  }
}

export default UserStorageNotFoundError;
