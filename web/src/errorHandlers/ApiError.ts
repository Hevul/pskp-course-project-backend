export default interface ApiError {
  msg: string;
  path?: string;
  status?: number;
}
