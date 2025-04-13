import config from "./config";
import DirService from "../../application/src/services/DirService";
import { FileLinkService } from "../../application/src/services/FileLinkService";
import { FileService } from "../../application/src/services/FileService";
import UserService from "../../application/src/services/UserService";
import UserStorageService from "../../application/src/services/UserStorageService";
import JwtProvider from "../../infrastructure/src/providers/JwtProvider";
import HashSha256Provider from "../../infrastructure/src/providers/HashSha256Provider";
import DirInfoRepository from "../../infrastructure/src/data/db/dirInfo/DirInfoRepository";
import DirRepository from "../../infrastructure/src/data/storage/dir/DirRepository";
import FileInfoRepository from "../../infrastructure/src/data/db/fileInfo/FileInfoRepository";
import FileLinkRepository from "../../infrastructure/src/data/db/fileLink/FileLinkRepository";
import FileRepository from "../../infrastructure/src/data/storage/file/FileRepository";
import UserRepository from "../../infrastructure/src/data/db/user/UserRepository";
import UserStorageRepository from "../../infrastructure/src/data/db/userStorage/UserStorageRepository";
import BlackRepository from "../../infrastructure/src/data/db/black/BlackRepository";
import AuthService from "../../application/src/services/AuthService";

const dirInfoRepository = new DirInfoRepository();
const dirRepository = new DirRepository(config.uploadDir);
const fileInfoRepository = new FileInfoRepository();
const fileLinkRepository = new FileLinkRepository();
const fileRepository = new FileRepository(config.uploadDir);
const userRepository = new UserRepository();
const userStorageRepository = new UserStorageRepository();
const blackRepository = new BlackRepository();

const jwtProvider = new JwtProvider(config.jwtSecret);
const hashProvider = new HashSha256Provider();

const dirService = new DirService(dirRepository, dirInfoRepository);
const fileLinkService = new FileLinkService(
  fileLinkRepository,
  fileInfoRepository,
  userRepository,
  hashProvider
);
const fileService = new FileService(
  fileInfoRepository,
  fileRepository,
  dirInfoRepository
);
const userService = new UserService(userRepository, hashProvider);
const userStorageService = new UserStorageService(
  userStorageRepository,
  dirRepository,
  fileInfoRepository,
  dirInfoRepository
);
const authService = new AuthService(
  userRepository,
  blackRepository,
  jwtProvider,
  hashProvider
);

const box = {
  dirService,
  fileLinkService,
  fileService,
  userService,
  userStorageService,
  jwtProvider,
  authService,
};

export default box;
