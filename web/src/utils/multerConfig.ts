import multer from "multer";
import fs from "fs";
import path from "path";
import { Request } from "express";

const tempDir = "/home/vlad/projects/project-casio/backend/temp";

// Создаем временную директорию, если не существует
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname}`;
    req.uploadingFileName = filename;
    cb(null, filename);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  req.on("aborted", () => {
    file.stream.on("end", () => {
      console.log(`Upload canceled for file: ${file.originalname}`);
      const filename = req.uploadingFileName;
      if (filename) {
        const filePath = path.join(tempDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted partial upload: ${filePath}`);
        }
      }
      cb(null, false);
    });
    file.stream.emit("end");
  });

  cb(null, true);
};

export const uploadLarge = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 },
});
