import { Response, Request, NextFunction } from "express";
import ApiError from "../../errorHandlers/ErrorConfig";

const extendResponse = (req: Request, res: Response, next: NextFunction) => {
  res.good = (props?: { message?: string; code?: number }) => {
    const message = props?.message;
    const code = props?.code ?? 200;

    return res.status(code).json({ message, ok: true });
  };

  res.bad = (props?: { message?: string; code?: number }) => {
    const message = props?.message;
    const code = props?.code ?? 400;

    return res.status(code).json({ message, ok: false });
  };

  res.error400 = (props: { errors: ApiError[] }) => {
    const errors = props.errors;

    return res.status(400).json({ errors });
  };

  next();
};

export default extendResponse;
