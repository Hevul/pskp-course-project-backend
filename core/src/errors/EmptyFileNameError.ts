class EmptyFileNameError extends Error {
  constructor() {
    super("Имя файла не может быть пустым");
    this.name = "EmptyFileNameError";
  }
}

export default EmptyFileNameError;
