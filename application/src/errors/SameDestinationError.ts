class SameDestinationError extends Error {
  constructor() {
    super();
    this.name = "SameDestinationError";
  }
}

export default SameDestinationError;
