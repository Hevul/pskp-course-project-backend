class DescriptionTooLongError extends Error {
  constructor(maxLength: number) {
    super(`Описание не может превышать ${maxLength} символов`);
    this.name = "DescriptionTooLongError";
  }
}

export default DescriptionTooLongError;
