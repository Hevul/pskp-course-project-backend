import "express-async-errors";
import { Request, Response, NextFunction, RequestHandler } from "express";
import IAuthService from "../../../application/src/interfaces/IAuthService";
import IJwtProvider from "../../../application/src/interfaces/IJwtProvider";
import config from "../config";

class AuthController {
  constructor(
    private readonly _authService: IAuthService,
    private readonly _jwtProvider: IJwtProvider
  ) {}

  logout: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = req.user;

    if (!user) {
      res.good({ message: "You are not logged in!" });
      return;
    }

    const isLoggedOut = await this._authService.isLoggedOut(user.id);

    if (isLoggedOut) {
      res.good({ message: "You are already logged out!" });
      return;
    }

    await this._authService.logout(user.id);

    res.good({ message: "Logged out successfully" });
  };

  login: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { login, password } = req.body;

    const token = await this._authService.login(login, password);

    res.cookie("token", token, {
      httpOnly: true,
      domain: config.address,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 3600000 * 8,
    });

    res.json({ data: token });
  };

  checkAuth: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const token = req.cookies.token;

    let isAuthenticated: boolean;

    if (!token) {
      isAuthenticated = false;
      res.json({ isAuthenticated });
      return;
    }

    const payload = this._jwtProvider.verify(token);

    if (!payload) {
      isAuthenticated = false;
      res.json({ isAuthenticated });
      return;
    }

    const isLoggedOut = await this._authService.isLoggedOut(payload.id);

    if (isLoggedOut) {
      isAuthenticated = false;
      res.json({ isAuthenticated });
      return;
    }

    isAuthenticated = true;

    res.json({ isAuthenticated });
  };
}

export default AuthController;
