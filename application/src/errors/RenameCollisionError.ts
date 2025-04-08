class RenameCollisionError extends Error {
  constructor() {
    super();
    this.name = "RenameCollisionError";
  }
}

export default RenameCollisionError;
