class MoveCollisionError extends Error {
  constructor() {
    super();
    this.name = "MoveCollisionError";
  }
}

export default MoveCollisionError;
