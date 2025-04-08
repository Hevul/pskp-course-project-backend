class NonPrintableCharactersError extends Error {
  constructor() {
    super("Имя содержит непечатаемые символы");
    this.name = "NonPrintableCharactersError";
  }
}

export default NonPrintableCharactersError;
