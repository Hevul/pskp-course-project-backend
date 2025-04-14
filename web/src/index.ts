import express from "express";
import cors from "cors";
import config from "./config";
import connect from "../../infrastructure/src/data/connect";
import extendResponse from "./middlewares/utils/extendResponse";
import health from "./middlewares/utils/health";
import cookieParser from "cookie-parser";
import box from "./box";

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

app.use("/api/auth", box.authRouter);
app.use("/api/user", box.userRouter);
app.use("/api/file", box.fileRouter);
app.use("/api/dir", box.dirRouter);
app.use("/api/storage", box.storageRouter);
app.use("/api/link", box.linkRouter);

app.listen(3001);

export default app;
