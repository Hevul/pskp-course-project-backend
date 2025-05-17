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

    const result = await this._entityService.moveMultiple({
      fileIds,
      dirIds,
      destinationId,
      overwrite,
    });

    const isHasConflicts =
      result.conflictingDirs.length + result.conflictingFiles.length > 0;

    if (result.success && !isHasConflicts) {
      res.status(200).json({
        success: true,
        message: "All objects were successfully moved",
        totalFiles: fileIds.length,
        totalDirs: dirIds.length,
      });
      return;
    }

    res.status(400).json({
      message: "Some objects could not be moved",
      ...result,
    });
  };

  copyMultiple = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { fileIds, dirIds, destinationId } = req.body;

    const result = await this._entityService.copyMultiple({
      fileIds,
      dirIds,
      destinationId,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "All objects were successfully copied",
        totalFiles: fileIds.length,
        totalDirs: dirIds.length,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: "Some objects could not be copied",
      ...result.errors,
    });
  };
}

export default EntityController;
