class CannotAddSelfAsFriendError extends Error {
  constructor() {
    super();
    this.name = "CannotAddSelfAsFriendError";
  }
}

export default CannotAddSelfAsFriendError;
