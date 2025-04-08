class CanNotBeEmptyError extends Error {
  public static readonly message: string = "Line can not be empty!";

  constructor() {
    super(CanNotBeEmptyError.message);
    this.name = "CanNotBeEmptyError";
  }
}

export default CanNotBeEmptyError;
