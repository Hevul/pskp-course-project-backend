class LineTooShortError extends Error {
  public static readonly message: string =
    "Line is too short (min length is 6 symbols)!";

  constructor() {
    super(LineTooShortError.message);
    this.name = "LineTooShortError";
  }
}

export default LineTooShortError;
