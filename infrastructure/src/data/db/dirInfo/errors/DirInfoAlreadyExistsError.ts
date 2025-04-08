import ErrorCode from "../../../ErrorCode";

class DirInfoAlreadyExistsError extends Error {
  public static readonly code = ErrorCode.DirInfoAlreadyExists;
  public static readonly message: string =
    "DirInfo with the same pathname already exists!";

  constructor() {
    super(DirInfoAlreadyExistsError.message);
    this.name = "DirInfoAlreadyExistsError";
  }
}

export default DirInfoAlreadyExistsError;
