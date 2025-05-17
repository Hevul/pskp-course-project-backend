import express from "express";
import cors from "cors";
import config from "./config";
import connect from "../../infrastructure/src/data/connect";
import extendResponse from "./middlewares/utils/extendResponse";
import cookieParser from "cookie-parser";
import box from "./box";
import { setupTempFileCleanup } from "./utils/cleaner";
import path from "path";
import { createDirIfNotExists } from "./utils/createDirIfNotExists";
import health from "./middlewares/utils/health";
import { notFoundHandler } from "./middlewares/utils/notFoundHandler";
import { errorHandler } from "./middlewares/utils/errorHandler";

async function init() {
  try {
    await createDirIfNotExists(config.tempDir);
    await createDirIfNotExists(config.uploadDir);

    await connect(config.dbConnectionString);

    const cleanup = setupTempFileCleanup({
      tempDir: config.tempDir,
      maxFileAge: config.tempFileMaxAge,
      interval: config.clearCheckInterval,
    });

    const app = express();

    app
      .use(
        cors({
          origin: `http://${config.corsSocket}`,
          credentials: true,
        })
      )
      .use("/", (req, res, next) => {
        console.log(req.url);
        next();
      })
      .use(express.json({ limit: `${config.maxFileSize}mb` }))
      .use(
        express.urlencoded({ limit: `${config.maxFileSize}mb`, extended: true })
      )
      .use(cookieParser())
      .use(extendResponse);

    app
      .use(`${config.apiPrefix}/auth`, box.authRouter)
      .use(`${config.apiPrefix}/user`, box.userRouter)
      .use(`${config.apiPrefix}/file`, box.fileRouter)
      .use(`${config.apiPrefix}/dir`, box.dirRouter)
      .use(`${config.apiPrefix}/storage`, box.storageRouter)
      .use(`${config.apiPrefix}/link`, box.linkRouter)
      .use(`${config.apiPrefix}/entity`, box.entityRouter)
      .use(`${config.apiPrefix}/health`, health);

    app.use(notFoundHandler);
    app.use(errorHandler);

    const server = app.listen(config.port);

    process.on("SIGTERM", () => {
      cleanup();
      server.close();
    });

    return app;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

init()
  .then((app) => console.log("Server initialization completed"))
  .catch((err) => console.error("Server initialization failed:", err));

export default init;
