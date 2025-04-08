import ApiError from "./ApiError";

export default interface ErrorConfig {
  errorName: string;
  errorDetails: ApiError;
}
