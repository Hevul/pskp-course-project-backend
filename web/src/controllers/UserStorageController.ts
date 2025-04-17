import "express-async-errors";
import { Request, Response, NextFunction } from "express";
import IUserStorageService from "../../../application/src/interfaces/IUserStorageService";

class UserStorageController {
  constructor(private readonly _userStorageService: IUserStorageService) {}

  getAllByUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = req.user!;

    let storages = await this._userStorageService.getAll();
    storages = storages.filter((s) => s.ownerId === user.id);

    res.json(storages);
  };

  getFullInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;

    const storageInfo = await this._userStorageService.getFullInfo(id);

    res.status(200).json({
      ...storageInfo,
    });
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = req.user!;
    const name = req.body.name;

    await this._userStorageService.create(name, user.id);

    res.good({ code: 201 });
  };

  get = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;

    const storage = await this._userStorageService.get(id);

    res.status(200).json({ storage, ok: true });
  };

  rename = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const name = req.body.name;

    await this._userStorageService.rename(id, name);

    res.good();
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const force = req.body.force;

    await this._userStorageService.delete(id, force);

    res.good();
  };
}

export default UserStorageController;
