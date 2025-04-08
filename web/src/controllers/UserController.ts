import "express-async-errors";
import IUserService from "../../../application/src/interfaces/IUserService";
import { Request, Response, NextFunction, RequestHandler } from "express";

class UserController {
  constructor(private readonly _userService: IUserService) {}

  get: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = req.user;

    res.json({
      id: user?.id,
      login: user?.login,
    });
  };

  getByIds: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const ids = req.body.ids;

    const users = await this._userService.getByIds(ids);

    const resultUsers = users.map((u) => {
      const { id, login } = u;
      return { id, name: login };
    });

    res.json({
      users: resultUsers,
    });
  };

  register: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { login, password } = req.body;

    const user = await this._userService.register(login, password);

    res.good({ code: 201, message: "User created!" });
  };
}

export default UserController;
