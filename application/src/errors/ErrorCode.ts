enum ErrorCode {
  InvalidLogin = 200,
  InvalidPassword,
  DirectoryIsNotEmpty,
  UserStorageNotEmpty,
  DirectoryMove,
  InvalidName,
  LinkAccessDenied,
  UserAlreadyRegistered,
  LinkAlreadyExists,
}

export default ErrorCode;
