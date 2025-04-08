class LineTooLongError extends Error {
  public static readonly message: string =
    "Line is too long (max length is 128 symbols)!";

  constructor() {
    super(LineTooLongError.message);
    this.name = "LineTooLongError";
  }
}

export default LineTooLongError;
