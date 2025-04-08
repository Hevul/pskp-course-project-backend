class NameTooLongError extends Error {
  constructor(maxLength: number) {
    super(`Имя не может превышать ${maxLength} символов`);
    this.name = "NameTooLongError";
  }
}

export default NameTooLongError;
