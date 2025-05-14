import config from "./config";
import DirService from "../../application/src/services/DirService";
import { AuthorizationService } from "../../application/src/services/AuthorizationService";
import { FileLinkService } from "../../application/src/services/FileLinkService";
import { FileService } from "../../application/src/services/FileService";
import UserService from "../../application/src/services/UserService";
import { EntityService } from "../../application/src/services/EntityService";
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
import authenticate from "./middlewares/utils/authenticate";
import UserController from "./controllers/UserController";
import AuthController from "./controllers/AuthController";
import DirController from "./controllers/DirController";
import { FileController } from "./controllers/FileController";
import FileLinkController from "./controllers/FileLinkController";
import UserStorageController from "./controllers/UserStorageController";
import createUserRouter from "./routers/userRouter";
import creteFileRouter from "./routers/fileRouter";
import createStorageRouter from "./routers/userStorageRouter";
import createAuthRouter from "./routers/authRouter";
import createDirRouter from "./routers/dirRouter";
import createLinkRouter from "./routers/linkRouter";
import createEntityRouter from "./routers/entityRouter";
import { createAuthorizeMiddlewareFactory } from "./middlewares/utils/createAuthorizeMiddlewareFactory";
import EntityController from "./controllers/EntityController";

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

const dirService = new DirService(
  dirInfoRepository,
  fileInfoRepository,
  fileLinkRepository,
  fileRepository
);
const fileLinkService = new FileLinkService(
  userStorageRepository,
  fileLinkRepository,
  fileInfoRepository,
  userRepository,
  hashProvider
);
const fileService = new FileService(
  fileInfoRepository,
  fileRepository,
  fileLinkRepository
);
const userService = new UserService(userRepository, hashProvider);
const userStorageService = new UserStorageService(
  userStorageRepository,
  dirRepository,
  fileInfoRepository,
  dirInfoRepository,
  fileLinkRepository
);
const authService = new AuthService(
  userRepository,
  blackRepository,
  jwtProvider,
  hashProvider
);
const authorizationService = new AuthorizationService(
  fileInfoRepository,
  dirInfoRepository,
  userStorageRepository,
  fileLinkRepository
);
const entityService = new EntityService(
  dirInfoRepository,
  fileInfoRepository,
  fileRepository,
  fileService,
  dirService
);

const createAuthenticate = () => authenticate(jwtProvider, userService);
const authorizeMiddlewareFactory =
  createAuthorizeMiddlewareFactory(authorizationService);

const userRouter = createUserRouter(
  new UserController(userService),
  createAuthenticate()
);
const fileRouter = creteFileRouter(
  createAuthenticate(),
  authorizeMiddlewareFactory,
  new FileController(fileService, fileLinkService)
);
const dirRouter = createDirRouter(
  createAuthenticate(),
  authorizeMiddlewareFactory,
  new DirController(dirService)
);
const storageRouter = createStorageRouter(
  createAuthenticate(),
  authorizeMiddlewareFactory,
  new UserStorageController(userStorageService)
);
const authRouter = createAuthRouter(
  new AuthController(authService, jwtProvider),
  createAuthenticate()
);
const linkRouter = createLinkRouter(
  createAuthenticate(),
  authorizeMiddlewareFactory,
  new FileLinkController(fileLinkService)
);
const entityRouter = createEntityRouter(
  new EntityController(entityService),
  authorizeMiddlewareFactory,
  createAuthenticate()
);

const box = {
  dirService,
  fileLinkService,
  fileService,
  userService,
  userStorageService,
  jwtProvider,
  authService,
  userRouter,
  fileRouter,
  dirRouter,
  storageRouter,
  authRouter,
  linkRouter,
  entityRouter,
};

export default box;
