import ErrorCode from "./ErrorCode";

class UserStorageNotEmptyError extends Error {
  public static readonly code = ErrorCode.UserStorageNotEmpty;
  public static readonly message: string = "UserStorage is not empty!";

  constructor() {
    super(UserStorageNotEmptyError.message);
    this.name = "UserStorageNotEmptyError";
  }
}

export default UserStorageNotEmptyError;
