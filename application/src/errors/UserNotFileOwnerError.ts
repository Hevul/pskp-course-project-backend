import ErrorCode from "./ErrorCode";

class UserNotFileOwnerError extends Error {
  public static readonly code = ErrorCode.DirectoryMove;
  public static readonly message: string = "User is not owner of this file!";

  constructor() {
    super(UserNotFileOwnerError.message);
    this.name = "UserNotFileOwnerError";
  }
}

export default UserNotFileOwnerError;
