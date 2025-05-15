import { Request, Response, NextFunction, RequestHandler } from "express";
import IJwtProvider from "../../../../application/src/interfaces/IJwtProvider";
import IUserService from "../../../../application/src/interfaces/IUserService";

const authenticate = (
  jwtProvider: IJwtProvider,
  userService: IUserService
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token)
      return res.bad({ code: 401, message: "Необходима аутентификация" });

    const payload = jwtProvider.verify(token);

    if (!payload)
      return res.bad({ code: 401, message: "Необходима аутентификация" });

    const userId = payload.id;

    req.user = await userService.getById(userId);

    next();
  };
};

export default authenticate;
