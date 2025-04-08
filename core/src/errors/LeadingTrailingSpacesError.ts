class LeadingTrailingSpacesError extends Error {
  constructor() {
    super("Имя не должно начинаться или заканчиваться пробелами");
    this.name = "LeadingTrailingSpacesError";
  }
}

export default LeadingTrailingSpacesError;
