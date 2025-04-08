import ErrorCode from "./ErrorCode";

class LinkAccessDeniedError extends Error {
  public static readonly code = ErrorCode.LinkAccessDenied;
  public static readonly message: string = "Link access denied!";

  constructor() {
    super(LinkAccessDeniedError.message);
    this.name = "LinkAccessDeniedError";
  }
}

export default LinkAccessDeniedError;
