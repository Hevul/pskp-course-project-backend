import ErrorCode from "../../../ErrorCode";

class PathCannotBeEmptyError extends Error {
  public static readonly code = ErrorCode.PathCannotBeEmpty;
  public static readonly message: string = "Path cannot be empty";

  constructor() {
    super(PathCannotBeEmptyError.message);
    this.name = "PathCannotBeEmptyError";
  }
}

export default PathCannotBeEmptyError;
