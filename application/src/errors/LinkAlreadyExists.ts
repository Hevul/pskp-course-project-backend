import ErrorCode from "./ErrorCode";

class LinkAlreadyExistsError extends Error {
  public static readonly code = ErrorCode.LinkAlreadyExists;
  public static readonly message: string = "Link already exists!";

  constructor() {
    super(LinkAlreadyExistsError.message);
    this.name = "LinkAlreadyExistsError";
  }
}

export default LinkAlreadyExistsError;
