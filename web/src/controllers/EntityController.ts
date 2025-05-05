import "express-async-errors";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { IEntityService } from "../../../application/src/interfaces/IEntityService";

class EntityController {
  constructor(private readonly _entityService: IEntityService) {}

  downloadMany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const fileIds = req.query.fileIds as string;
    const dirIds = req.query.dirIds as string;

    const parsedFileIds = JSON.parse(fileIds);
    const parsedDirIds = JSON.parse(dirIds);

    const { archiveName, fileStream } =
      await this._entityService.downloadMultiple({
        fileIds: parsedFileIds,
        dirIds: parsedDirIds,
      });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${archiveName}"`
    );
    res.setHeader("Cache-Control", "no-cache");

    fileStream.pipe(res);
  };

  moveMultiple = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { fileIds, dirIds, destinationId, overwrite } = req.body;

    const conflicts = await this._entityService.moveMultiple({
      fileIds,
      dirIds,
      destinationId,
      overwrite,
    });

    if (
      conflicts.conflictingFiles.length > 0 ||
      conflicts.conflictingDirs.length > 0
    )
      res.status(400).json(conflicts);
    else res.good({ message: "Entities were moved" });
  };
}

export default EntityController;
