class DirectoryNameEndsWithDotError extends Error {
  constructor() {
    super("Имя директории не должно заканчиваться точкой");
    this.name = "DirectoryNameEndsWithDotError";
  }
}

export default DirectoryNameEndsWithDotError;
