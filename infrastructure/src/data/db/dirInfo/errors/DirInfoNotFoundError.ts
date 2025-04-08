import ErrorCode from "../../../ErrorCode";

class DirInfoNotFoundError extends Error {
  public static readonly code = ErrorCode.DirInfoNotFound;
  public static readonly message: string =
    "Object of DirInfo was not found in data base!";

  constructor() {
    super(DirInfoNotFoundError.message);
    this.name = "DirInfoNotFoundError";
  }
}

export default DirInfoNotFoundError;
