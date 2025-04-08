import ErrorCode from "../../../ErrorCode";

class UserStorageAlreadyExistsError extends Error {
  public static readonly code = ErrorCode.UserStorageAlreadyExists;
  public static readonly message: string =
    "UserStorage with the same name already exists!";

  constructor() {
    super(UserStorageAlreadyExistsError.message);
    this.name = "UserStorageAlreadyExistsError";
  }
}

export default UserStorageAlreadyExistsError;
