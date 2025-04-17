import { Request, Response, NextFunction } from "express";
import ErrorConfig from "./ErrorConfig";
import ApiError from "./ApiError";

function createErrorHandler(errorConfigs: ErrorConfig[]) {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    let errors: ApiError[] | null = null;

    const errorConfig = errorConfigs.find(
      (config) => config.errorName === err.name
    );

    if (errorConfig) errors = [errorConfig.errorDetails];

    if (errors)
      res.status(errorConfig!.errorDetails.status ?? 400).json({ errors });
    else next(err);
  };
}

export default createErrorHandler;
