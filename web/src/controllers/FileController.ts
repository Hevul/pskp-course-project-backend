import "express-async-errors";
import { Request, Response, NextFunction } from "express";
import IFileService from "../../../application/src/interfaces/IFileService";
import config from "../config";
import IFileLinkService from "../../../application/src/interfaces/IFileLinkService";
import fs, { createReadStream } from "fs";

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

    const [_, pathname] = await this._fileService.download(id);

    const fullPath = `${config.uploadDir}${pathname}`;

    res.download(fullPath);
  };

  upload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const file = req.file as Express.Multer.File;
      const { storageId, name } = req.body;
      const parentId = req.body.parentId === "" ? undefined : req.body.parentId;

      const fileStream = createReadStream(file.path);

      await this._fileService.upload(
        name,
        fileStream,
        storageId,
        file.size,
        parentId
      );

      fs.unlinkSync(file.path);

      res.good({ message: `File ${name} uploaded successfully` });
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

  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const file = req.file;
    const id = req.body.id;

    const buffer = file!.buffer;

    await this._fileService.overwrite(id, buffer);

    res.good({ message: "File is updated" });
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
    const id = req.body.id;
    const parentId = req.body.parentId;

    await this._fileService.move(id, parentId);

    res.good({ message: "File is moved" });
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
