import { Response, Request, NextFunction, RequestHandler } from "express";

const health: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.good({ message: "I'm alive!" });
};

export default health;
