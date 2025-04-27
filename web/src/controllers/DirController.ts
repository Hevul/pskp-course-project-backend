import "express-async-errors";
import { Request, Response, NextFunction } from "express";
import IDirService from "../../../application/src/interfaces/IDirService";

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
    const id = req.body.id;
    const parentId = req.body.parentId;

    await this._dirService.move(id, parentId);

    res.good();
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

    const { stream, size } = await this._dirService.download(id);

    console.log("finita");

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${id}.zip"`);
    res.setHeader("Content-Length", size);

    stream.pipe(res);
  };
}

export default DirController;
