class FriendAlreadyAddedError extends Error {
  constructor() {
    super();
    this.name = "FriendAlreadyAddedError";
  }
}

export default FriendAlreadyAddedError;
