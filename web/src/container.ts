import { createContainer, asClass, asFunction } from "awilix";
import FileInfoRepository from "../../infrastructure/src/data/db/fileInfo/FileInfoRepository";
import FileRepository from "../../infrastructure/src/data/storage/file/FileRepository";
import DirInfoRepository from "../../infrastructure/src/data/db/dirInfo/DirInfoRepository";
import { FileService } from "../../application/src/services/FileService";
import { FileLinkService } from "../../application/src/services/FileLinkService";
import { FileController } from "./controllers/FileController";
import authenticate from "./middlewares/utils/authenticate";
import createRouter from "./routers/fileRouter";
import JwtProvider from "../../infrastructure/src/providers/JwtProvider";
import UserService from "../../application/src/services/UserService";

const container = createContainer();

// Регистрируем зависимости
container.register({
  // Репозитории
  fileInfoRepository: asClass(FileInfoRepository).singleton(),
  fileRepository: asClass(FileRepository).singleton(),
  dirInfoRepository: asClass(DirInfoRepository).singleton(),

  // Сервисы
  fileService: asClass(FileService).singleton(),
  jwtProvider: asClass(JwtProvider).singleton(),
  userService: asClass(UserService).singleton(),

  // Контроллеры
  fileController: asClass(FileController),

  // Роутер и middleware
  authenticate: asFunction(authenticate).inject(() => ({
    jwtProvider: container.resolve("jwtProvider"),
    userService: container.resolve("userService"),
  })),
  fileRouter: asFunction(createRouter),
});

export { container };
