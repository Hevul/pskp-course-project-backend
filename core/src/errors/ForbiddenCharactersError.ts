class ForbiddenCharactersError extends Error {
  constructor(forbiddenChars: string[]) {
    super(`Имя содержит запрещённые символы: ${forbiddenChars.join(", ")}`);
    this.name = "ForbiddenCharactersError";
  }
}

export default ForbiddenCharactersError;
