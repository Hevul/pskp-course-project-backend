import { Request, Response, NextFunction } from "express";

const requireFile = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  const name = req.body.name;

  if (!file) return res.bad({ message: "Can not find file in request" });
  if (!name) return res.bad({ message: "Can not find file name in request" });

  next();
};

export default requireFile;
