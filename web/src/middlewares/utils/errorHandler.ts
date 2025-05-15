import { ErrorRequestHandler } from "express";
import config from "../../config";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message);

  const status = (err as any).status || 500;

  res.status(status).json({
    error: err.name || "Internal Server Error",
    message: err.message || "Something went wrong",
    ...(config.env === "development" && { stack: err.stack }),
  });
};
