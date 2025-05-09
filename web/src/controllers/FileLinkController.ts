import { Request, Response, NextFunction } from "express";
import IFileLinkService from "../../../application/src/interfaces/IFileLinkService";
import config from "../config";

class FileLinkController {
  constructor(private readonly _fileLinkService: IFileLinkService) {}

  getAllByOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = req.user!;

    let links = await this._fileLinkService.getAllByOwnerId(user.id);

    const linksWithFilenames = await Promise.all(
      links.map(async (l) => {
        const fullInfo = await this._fileLinkService.getFullInfo(l.id);
        return {
          ...l,
          filename: fullInfo.filename,
        };
      })
    );

    res.json({ links: linksWithFilenames });
  };

  getFullInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = req.user!;
    const id = req.params.id;

    await this._fileLinkService.checkAccess({ id }, user.id);
    const fullInfo = await this._fileLinkService.getFullInfo(id);

    res.status(200).json({ fullInfo });
  };

  getByLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const link = req.params.link;
    const user = req.user!;

    await this._fileLinkService.checkAccess(link, user.id);
    const [fileLink, fileInfo] = await this._fileLinkService.getByLink(link);

    res.status(200).json({ link: { ...fileLink, filename: fileInfo.name } });
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

  getByFileInfoId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;

    const link = await this._fileLinkService.getByFileInfoId(id);

    res.status(200).json({ link });
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.body.id;
    const user = req.user!;

    const link = await this._fileLinkService.generate(user.id, id);

    res.status(200).json({ link });
  };

  download = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const link = req.params.link;
    const user = req.user!;

    await this._fileLinkService.checkAccess(link, user.id);
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

    const link = await this._fileLinkService.addFriend(id, friendName);

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

  updateNameAndDescription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { id, name, description } = req.body;

    await this._fileLinkService.updateName(id, name);
    await this._fileLinkService.updateDescription(id, description);

    res.good({ message: "Name and description were updated!" });
  };
}

export default FileLinkController;
