import express from "express";
import cors from "cors";
import config from "./config";
import connect from "../../infrastructure/src/data/connect";
import createUserRouter from "./routers/userRouter";
import creteFileRouter from "./routers/fileRouter";
import createStorageRouter from "./routers/userStorageRouter";
import createAuthRouter from "./routers/authRouter";
import createDirRouter from "./routers/dirRouter";
import createLinkRouter from "./routers/linkRouter";
import box from "./box";
import UserController from "./controllers/UserController";
import extendResponse from "./middlewares/utils/extendResponse";
import FileController from "./controllers/FileController";
import UserStorageController from "./controllers/UserStorageController";
import authenticate from "./middlewares/utils/authenticate";
import health from "./middlewares/utils/health";
import cookieParser from "cookie-parser";
import AuthController from "./controllers/AuthController";
import DirController from "./controllers/DirController";
import FileLinkController from "./controllers/FileLinkController";

connect(config.dbConnectionString);

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use("/", (req, res, next) => {
  console.log(req.url);
  next();
});
app.use(express.json({ limit: "5gb" }));
app.use(express.urlencoded({ limit: "5gb", extended: true }));
app.use(cookieParser());
app.use(extendResponse);
app.use("/health", health);

const createAuthenticate = () => authenticate(box.jwtProvider, box.userService);

const userRouter = createUserRouter(
  new UserController(box.userService),
  createAuthenticate()
);
const fileRouter = creteFileRouter(
  createAuthenticate(),
  new FileController(box.fileService, box.fileLinkService)
);
const dirRouter = createDirRouter(
  createAuthenticate(),
  new DirController(box.dirService)
);
const storageRouter = createStorageRouter(
  new UserStorageController(box.userStorageService),
  createAuthenticate()
);
const authRouter = createAuthRouter(
  new AuthController(box.authService, box.jwtProvider),
  createAuthenticate()
);
const linkRouter = createLinkRouter(
  new FileLinkController(box.fileLinkService, box.userService),
  createAuthenticate()
);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/file", fileRouter);
app.use("/api/dir", dirRouter);
app.use("/api/storage", storageRouter);
app.use("/api/link", linkRouter);

app.listen(3001);

export default app;
