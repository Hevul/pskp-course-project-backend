import express from "express";
import cors from "cors";
import config from "./config";
import connect from "../../infrastructure/src/data/connect";
import extendResponse from "./middlewares/utils/extendResponse";
import cookieParser from "cookie-parser";
import box from "./box";
import { setupTempFileCleanup } from "./utils/cleaner";
import path from "path";

connect(config.dbConnectionString);

const cleanup = setupTempFileCleanup({
  tempDir: config.tempDir,
  maxFileAge: config.tempFileMaxAge,
  interval: config.clearCheckInterval,
});

const app = express();

app
  .use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  )
  .use(express.static(path.join(__dirname, "../public")))
  .use("/", (req, res, next) => {
    console.log(req.url);
    next();
  })
  .use(express.json({ limit: "5gb" }))
  .use(express.urlencoded({ limit: "5gb", extended: true }))
  .use(cookieParser())
  .use(extendResponse);

app
  .use("/api/auth", box.authRouter)
  .use("/api/user", box.userRouter)
  .use("/api/file", box.fileRouter)
  .use("/api/dir", box.dirRouter)
  .use("/api/storage", box.storageRouter)
  .use("/api/link", box.linkRouter);

process.on("SIGTERM", () => {
  cleanup();
  server.close();
});

const server = app.listen(3001);

export default app;
