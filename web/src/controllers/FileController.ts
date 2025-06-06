import "express-async-errors";
import { Request, Response, NextFunction } from "express";
import IFileService from "../../../application/src/interfaces/IFileService";
import config from "../config";
import IFileLinkService from "../../../application/src/interfaces/IFileLinkService";
import fs, { createReadStream } from "fs";
import path from "path";
import mime from "mime";
import MoveCollisionError from "../../../application/src/errors/MoveCollisionError";

export class FileController {
  constructor(
    private readonly _fileService: IFileService,
    private readonly _fileLinkService: IFileLinkService
  ) {}

  get = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;

    const file = await this._fileService.get(id);

    res.json(file);
  };

  getAllByStorageId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { storageId, parentId } = req.params;
    const user = req.user;

    const [files, links] = await Promise.all([
      this._fileService.getAllByStorageId(storageId),
      this._fileLinkService.getAllByOwnerId(user!.id),
    ]);

    const filesWithLinks = new Set(links.map((link) => link.fileInfoId));

    let resultFiles = files
      .filter((f) => (parentId ? f.parent === parentId : !f.parent))
      .map((file) => ({
        ...file,
        hasLink: filesWithLinks.has(file.id),
      }));

    res.json({ files: resultFiles, ok: true });
  };

  download = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;

    const [file, readStream] = await this._fileService.download(id);

    const encodedFilename = encodeURIComponent(file.name)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A")
      .replace(/%(?:7C|60|5E)/g, unescape);

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedFilename}`
    );
    res.setHeader("Content-Length", file.size);
    res.setHeader("Cache-Control", "no-cache");

    readStream.pipe(res);
  };

  downloadMany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const fileIds = req.query.fileIds as string;

    const parsedIds = JSON.parse(fileIds);

    const { archiveName, fileStream } =
      await this._fileService.downloadMultiple(parsedIds);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${archiveName}"`
    );
    res.setHeader("Cache-Control", "no-cache");

    fileStream.pipe(res);
  };

  view = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { id } = req.params;

    const [file, fileStream] = await this._fileService.download(id);

    const mimeType = mime.lookup(file.name) || "application/octet-stream";
    const encodedFilename = encodeURIComponent(file.name);

    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename=${encodedFilename}}`,
      "Cache-Control": "public, max-age=3600",
    });

    fileStream.pipe(res);
  };

  upload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const file = req.file as Express.Multer.File;
    const { storageId, name, overwrite } = req.body;
    const parentId = req.body.parentId === "" ? undefined : req.body.parentId;

    const shouldOverwrite = overwrite === "true";

    const existingFile = await this._fileService.checkFileExists(
      name,
      storageId,
      parentId
    );

    if (existingFile && !shouldOverwrite) {
      res.status(400).json({
        error: "File already exists",
        conflict: true,
        tempFileId: file.filename,
        existingFileId: existingFile.id,
      });

      return;
    }

    const fileStream = createReadStream(file.path);

    if (existingFile && shouldOverwrite) {
      await this._fileService.overwrite(existingFile.id, fileStream, file.size);
    } else {
      await this._fileService.upload(
        name,
        fileStream,
        storageId,
        file.size,
        parentId
      );
    }

    fs.unlinkSync(file.path);

    res.good({
      message: `File ${name} ${
        existingFile ? "overwritten" : "uploaded"
      } successfully`,
    });
  };

  confirmOverwrite = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { existingFileId, tempFileId } = req.body;
      const tempFilePath = path.join(config.tempDir, tempFileId);

      if (!tempFileId) {
        throw new Error("No temporary file available for overwrite");
      }

      const fileStream = createReadStream(tempFilePath);
      const stats = fs.statSync(tempFilePath);

      await this._fileService.overwrite(existingFileId, fileStream, stats.size);

      fs.unlinkSync(tempFilePath);

      res.good({ message: "File overwritten successfully" });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;

    await this._fileService.delete(id);

    res.good({ message: "File is deleted" });
  };

  copy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const parentId = req.body.parentId;

    await this._fileService.copy(id, parentId);

    res.good({ message: "File is copied" });
  };

  move = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id, parentId, newName, overwrite } = req.body;

      await this._fileService.move({
        id,
        destinationId: parentId,
        newName,
        overwrite,
      });

      res.good({ message: "File is moved" });
    } catch (error) {
      if (error instanceof MoveCollisionError) {
        res.status(400).json({
          message: "File with the same name already exists",
          conflictingId: error.conflictingId,
        });
      } else throw error;
    }
  };

  rename = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const name = req.body.name;

    await this._fileService.rename(id, name);

    res.good({ message: "File is renamed" });
  };
}
