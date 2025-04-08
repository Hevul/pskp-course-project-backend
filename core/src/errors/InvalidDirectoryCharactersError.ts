class InvalidDirectoryCharactersError extends Error {
  constructor(allowedCharsDescription: string) {
    super(
      `Имя директории содержит недопустимые символы. Разрешены: ${allowedCharsDescription}`
    );
    this.name = "InvalidDirectoryCharactersError";
  }
}

export default InvalidDirectoryCharactersError;
