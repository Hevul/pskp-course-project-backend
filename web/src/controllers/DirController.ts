import "express-async-errors";
import { Request, Response, NextFunction } from "express";
import IDirService from "../../../application/src/interfaces/IDirService";

class DirController {
  constructor(private readonly _dirService: IDirService) {}

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
    const force = req.body.force;

    await this._dirService.delete(id, true);

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
}

export default DirController;
