import "express-async-errors";
import { Request, Response, NextFunction } from "express";
import IDirService from "../../../application/src/interfaces/IDirService";
import MoveCollisionError from "../../../application/src/errors/MoveCollisionError";

class DirController {
  constructor(private readonly _dirService: IDirService) {}

  getFullInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;

    const fullInfo = await this._dirService.getFullInfo(id);

    res.json({ ...fullInfo });
  };

  getAllByStorageId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { storageId, parentId } = req.params;

    let dirs = await this._dirService.getAllByStorageId(storageId);

    if (parentId) dirs = dirs.filter((d) => d.parent === parentId);
    else dirs = dirs.filter((d) => !d.parent);

    res.json({ dirs, ok: true });
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { name, storageId, parentId } = req.body;

    await this._dirService.create(name, storageId, parentId);

    res.good();
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;

    await this._dirService.delete(id);

    res.good();
  };

  copy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const parentId = req.body.parentId;

    await this._dirService.copy(id, parentId);

    res.good();
  };

  move = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { newName, id, parentId, overwrite } = req.body;

      await this._dirService.move({
        id,
        destinationId: parentId,
        newName,
        overwrite,
      });

      res.good();
    } catch (error) {
      if (error instanceof MoveCollisionError) {
        res.status(400).json({
          message: "Directory with the same name already exists",
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

    await this._dirService.rename(id, name);

    res.good();
  };

  download = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { id } = req.params;

    const { fileStream, archiveName } = await this._dirService.download(id);

    const encodedFilename = encodeURIComponent(archiveName)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A")
      .replace(/%(?:7C|60|5E)/g, unescape);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodedFilename}"`
    );

    fileStream.pipe(res);
  };

  downloadMany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const dirIds = req.query.dirIds as string;

    const parsedIds = JSON.parse(dirIds);

    const { archiveName, fileStream } = await this._dirService.downloadMultiple(
      parsedIds
    );

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${archiveName}`);

    fileStream.pipe(res);
  };
}

export default DirController;
