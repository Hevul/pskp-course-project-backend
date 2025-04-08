import { Request, Response, NextFunction } from "express";

const authorize = (
  action: (id: string, userId: string) => Promise<boolean>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id ?? req.body.id;
    const user = req.user!;

    const haveAccess = await action(id, user.id);

    if (!haveAccess) return res.bad({ code: 403, message: "Access denied!" });

    next();
  };
};

export default authorize;
