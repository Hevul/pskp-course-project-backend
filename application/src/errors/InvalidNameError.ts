import ErrorCode from "./ErrorCode";

class InvalidNameError extends Error {
  public static readonly code = ErrorCode.InvalidName;
  public static readonly message: string = "Name of entity is invalid!";

  constructor() {
    super(InvalidNameError.message);
    this.name = "InvalidNameError";
  }
}

export default InvalidNameError;
