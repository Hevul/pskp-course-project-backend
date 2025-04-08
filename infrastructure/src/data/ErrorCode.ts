enum ErrorCode {
  FileInfoNotFound = 300,
  FileLinkNotFound,
  UserNotFound,
  UserAlreadyExists,
  FileInfoAlreadyExists,
  FileLinkAlreadyExists,
  PathCannotBeEmpty,
  InvalidCharsInPath,
  AbsolutePathNotAllowed,
  PathOutsideBaseDirectory,
  PathnameMaxLength,
  DirInfoNotFound,
  FileAlreadyExists,
  UserStorageNotFound,
  DirInfoAlreadyExists,
  DirectoryAlreadyExists,
  DirectoryNotFound,
  UserStorageAlreadyExists,
  FileNotFound,
  DirInfoHasChild,
}

export default ErrorCode;
