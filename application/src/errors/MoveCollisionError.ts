class MoveCollisionError extends Error {
  constructor(public conflictingId: string) {
    super("File with the same name already exists");
    this.name = "MoveCollisionError";
  }
}

export default MoveCollisionError;
