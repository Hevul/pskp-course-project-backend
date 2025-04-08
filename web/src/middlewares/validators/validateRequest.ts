import { validationResult } from "express-validator";
import { Request, Response, NextFunction, RequestHandler } from "express";
import ApiError from "../../errorHandlers/ApiError";

const validateRequest: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: ApiError[] = errors.array().map((err) => {
      if (err.type === "field") {
        return {
          value: err.value || "",
          msg: err.msg,
          path: err.path,
        };
      } else {
        return {
          value: "",
          msg: err.msg,
          path: err.msg,
        };
      }
    });

    res.status(400).json({ errors: formattedErrors });
  } else next();
};

export default validateRequest;
