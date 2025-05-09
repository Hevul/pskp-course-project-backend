import fs from "fs";
import { Request, Response, NextFunction } from "express";

export const uploadCleanup = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalEnd = res.end.bind(res);

  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    if (req.aborted) {
      const file = req.file as Express.Multer.File;
      if (file?.path) {
        try {
          fs.unlinkSync(file.path);
          console.log(`Deleted partial upload: ${file.path}`);
        } catch (err) {
          console.error(`Error deleting partial upload: ${file.path}`, err);
        }
      }
    }

    // Вызываем оригинальный обработчик с правильными аргументами
    if (typeof chunk === "function") {
      return originalEnd(chunk);
    } else if (typeof encoding === "function") {
      return originalEnd(chunk, encoding);
    } else {
      return originalEnd(chunk, encoding, callback);
    }
  };

  // Добавляем обработчик события закрытия соединения
  req.on("close", () => {
    if (!res.headersSent) {
      const file = req.file as Express.Multer.File;
      if (file?.path) {
        try {
          fs.unlinkSync(file.path);
          console.log(`Connection closed, deleted: ${file.path}`);
        } catch (err) {
          console.error("Error cleaning up on connection close:", err);
        }
      }
    }
  });

  next();
};
