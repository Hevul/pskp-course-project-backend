import { Request, Response, NextFunction } from "express";
import IFileLinkService from "../../../application/src/interfaces/IFileLinkService";
import IUserService from "../../../application/src/interfaces/IUserService";
import config from "../config";

class FileLinkController {
  constructor(
    private readonly _fileLinkService: IFileLinkService,
    private readonly _userService: IUserService
  ) {}

  getAllByOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = req.user!;

    const links = await this._fileLinkService.getAllByOwnerId(user.id);

    res.json(links);
  };

  getByLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const link = req.params.link;

    const fileLink = await this._fileLinkService.getByLink(link);

    res.status(200).json({ link: fileLink, ok: true });
  };

  get = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;

    const link = await this._fileLinkService.getById(id);

    res.status(200).json({ link, ok: true });
  };

  getOrGenerate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { fileId } = req.body;
    const user = req.user!;

    const link = await this._fileLinkService.getOrGenerate(
      user.id,
      fileId,
      [],
      true
    );

    res.status(200).json({ link, ok: true });
  };

  download = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const link = req.params.link;
    const user = req.user!;

    const [file, pathname] = await this._fileLinkService.download(
      link,
      user.id
    );

    const fullPath = `${config.uploadDir}${pathname}`;

    res.header("Access-Control-Expose-Headers", "Content-Disposition");

    res.download(fullPath, file.name);
  };

  addFriend = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const friendName = req.body.friendName;

    const friend = await this._userService.getByLogin(friendName);
    const link = await this._fileLinkService.addFriend(id, friend.id);

    res.status(200).json({ link, ok: true });
  };

  removeFriend = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const friendId = req.body.friendId;

    const link = await this._fileLinkService.removeFriend(id, friendId);

    res.status(200).json({ link, ok: true });
  };

  removeAllFriends = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;

    await this._fileLinkService.removeAllFriends(id);

    res.good({ message: "All friends removed!" });
  };

  setPublicity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const publicity = req.body.publicity;

    await this._fileLinkService.setPublicity(id, publicity);

    res.good({ message: "Publicity updated" });
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;

    await this._fileLinkService.delete(id);

    res.good({ message: "Link was deleted!" });
  };
}

export default FileLinkController;
