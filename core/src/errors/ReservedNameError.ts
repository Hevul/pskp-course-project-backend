class ReservedNameError extends Error {
  constructor(name: string) {
    super(`"${name}" является зарезервированным именем`);
    this.name = "ReservedNameError";
  }
}

export default ReservedNameError;
