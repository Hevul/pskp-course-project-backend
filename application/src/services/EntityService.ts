import { Readable, PassThrough } from "stream";
import archiver from "archiver";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileRepository from "../../../core/src/repositories/IFileRepository";
import { IEntityService } from "../interfaces/IEntityService";
import IFileService from "../interfaces/IFileService";
import IDirService from "../interfaces/IDirService";
import MoveCollisionError from "../errors/MoveCollisionError";
import SameDestinationError from "../errors/SameDestinationError";
import DirectoryMoveInChildError from "../errors/DirectoryMoveInChildError";
import DirectoryMoveInItSelfError from "../errors/DirectoryMoveInItSelfError";

export class EntityService implements IEntityService {
  constructor(
    private readonly _dirInfoRepository: IDirInfoRepository,
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _fileRepository: IFileRepository,
    private readonly _fileService: IFileService,
    private readonly _dirService: IDirService
  ) {}

  private _getErrorMessage(error: unknown, type: "file" | "dir"): string {
    if (error instanceof SameDestinationError) {
      return type === "file"
        ? "Файл уже существует в целевой директории"
        : "Папка уже существует в целевой директории";
    }
    if (error instanceof DirectoryMoveInItSelfError)
      return "Невозможно скопировать папку в саму себя";
    if (error instanceof DirectoryMoveInChildError)
      return "Невозможно скопировать папку в её подпапку";
    if (error instanceof Error) return error.message;
    return "Неизвестная ошибка при копировании";
  }

  async copyMultiple(options: {
    fileIds: string[];
    dirIds: string[];
    destinationId?: string;
  }): Promise<{
    success: boolean;
    errors?: Array<{
      id: string;
      name: string;
      type: "file" | "dir";
      error: string;
    }>;
  }> {
    const { fileIds, dirIds, destinationId } = options;
    const errors: Array<{
      id: string;
      name: string;
      type: "file" | "dir";
      error: string;
    }> = [];

    for (const id of dirIds) {
      const validation = await this._validateMoveOrCopy(
        id,
        "dir",
        destinationId,
        "copy"
      );
      if (validation.error) {
        errors.push({
          id,
          name: validation.name,
          type: "dir",
          error: validation.error,
        });
      }
    }

    for (const id of fileIds) {
      const validation = await this._validateMoveOrCopy(
        id,
        "file",
        destinationId,
        "copy"
      );
      if (validation.error) {
        errors.push({
          id,
          name: validation.name,
          type: "file",
          error: validation.error,
        });
      }
    }

    if (errors.length > 0) return { success: false, errors };

    try {
      await Promise.all([
        ...dirIds.map(async (id) => {
          try {
            await this._dirService.copy(id, destinationId);
          } catch (error) {
            const sourceDir = await this._dirInfoRepository.get(id);
            errors.push({
              id,
              name: sourceDir.name,
              type: "dir",
              error: this._getErrorMessage(error, "dir"),
            });
            throw error;
          }
        }),
        ...fileIds.map(async (id) => {
          try {
            await this._fileService.copy(id, destinationId);
          } catch (error) {
            const sourceFile = await this._fileInfoRepository.get(id);
            errors.push({
              id,
              name: sourceFile.name,
              type: "file",
              error: this._getErrorMessage(error, "file"),
            });
            throw error;
          }
        }),
      ]);

      return { success: errors.length === 0, errors };
    } catch {
      return { success: false, errors };
    }
  }

  async moveMultiple(options: {
    fileIds: string[];
    dirIds: string[];
    destinationId?: string;
    overwrite?: boolean;
  }): Promise<{
    success: boolean;
    conflictingFiles: { movedId: string; originalId: string }[];
    conflictingDirs: { movedId: string; originalId: string }[];
    errors?: Array<{
      id: string;
      name: string;
      type: "file" | "dir";
      error: string;
    }>;
  }> {
    const { fileIds, dirIds, destinationId, overwrite } = options;
    const conflictingFiles: { movedId: string; originalId: string }[] = [];
    const conflictingDirs: { movedId: string; originalId: string }[] = [];
    const errors: Array<{
      id: string;
      name: string;
      type: "file" | "dir";
      error: string;
    }> = [];

    for (const id of dirIds) {
      const validation = await this._validateMoveOrCopy(
        id,
        "dir",
        destinationId,
        "move"
      );
      if (validation.error) {
        errors.push({
          id,
          name: validation.name,
          type: "dir",
          error: validation.error,
        });
      }
    }

    for (const id of fileIds) {
      const validation = await this._validateMoveOrCopy(
        id,
        "file",
        destinationId,
        "move"
      );
      if (validation.error) {
        errors.push({
          id,
          name: validation.name,
          type: "file",
          error: validation.error,
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        conflictingFiles: [],
        conflictingDirs: [],
        errors,
      };
    }

    for (const id of dirIds) {
      try {
        await this._dirService.move({ id, overwrite, destinationId });
      } catch (error) {
        if (error instanceof MoveCollisionError) {
          conflictingDirs.push({
            movedId: id,
            originalId: error.conflictingId,
          });
        } else {
          const dir = await this._dirInfoRepository.get(id);
          errors.push({
            id,
            name: dir.name,
            type: "dir",
            error: this._getErrorMessage(error, "dir"),
          });
        }
      }
    }

    for (const id of fileIds) {
      try {
        await this._fileService.move({ id, overwrite, destinationId });
      } catch (error) {
        if (error instanceof MoveCollisionError) {
          conflictingFiles.push({
            movedId: id,
            originalId: error.conflictingId,
          });
        } else {
          const file = await this._fileInfoRepository.get(id);
          errors.push({
            id,
            name: file.name,
            type: "file",
            error: this._getErrorMessage(error, "file"),
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      conflictingFiles,
      conflictingDirs,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async _validateMoveOrCopy(
    id: string,
    type: "file" | "dir",
    destinationId?: string,
    operation: "move" | "copy" = "move"
  ): Promise<{ name: string; error?: string }> {
    try {
      if (type === "dir") {
        const dir = await this._dirInfoRepository.get(id);

        if (id === destinationId) throw new DirectoryMoveInItSelfError();
        if (dir.parent === destinationId) throw new SameDestinationError();

        if (destinationId) {
          const destinationPath = await this._dirInfoRepository.getPath(
            destinationId
          );
          const currentPath = await this._dirInfoRepository.getPath(id);
          if (destinationPath.startsWith(`${currentPath}/`)) {
            throw new DirectoryMoveInChildError();
          }
        }

        return { name: dir.name };
      } else {
        const file = await this._fileInfoRepository.get(id);
        if (file.parent === destinationId) throw new SameDestinationError();
        return { name: file.name };
      }
    } catch (error) {
      const name =
        type === "dir"
          ? (await this._dirInfoRepository.get(id)).name
          : (await this._fileInfoRepository.get(id)).name;

      return {
        name,
        error: this._getErrorMessage(error, type),
      };
    }
  }

  private async _addFileToArchive(
    fileId: string,
    archive: archiver.Archiver,
    pathPrefix: string = ""
  ): Promise<void> {
    try {
      const file = await this._fileInfoRepository.get(fileId);
      const fileStream = await this._fileRepository.getStream(file.path());
      archive.append(fileStream, { name: `${pathPrefix}${file.name}` });
    } catch (err) {
      console.error(`Error adding file ${fileId} to archive:`, err);
      throw err;
    }
  }

  private async _addDirectoryToArchive(
    dirId: string,
    archive: archiver.Archiver,
    pathPrefix: string = ""
  ): Promise<void> {
    try {
      const dir = await this._dirInfoRepository.get(dirId);

      archive.append("", { name: `${pathPrefix}${dir.name}/` });

      const files = await this._fileInfoRepository.find({ parent: dirId });
      await Promise.all(
        files.map((file) =>
          this._addFileToArchive(file.id, archive, `${pathPrefix}${dir.name}/`)
        )
      );

      const subDirs = await this._dirInfoRepository.find({ parent: dirId });
      await Promise.all(
        subDirs.map((subDir) =>
          this._addDirectoryToArchive(
            subDir.id,
            archive,
            `${pathPrefix}${dir.name}/`
          )
        )
      );
    } catch (err) {
      console.error(`Error adding directory ${dirId} to archive:`, err);
      throw err;
    }
  }

  async downloadMultiple(options: {
    fileIds: string[];
    dirIds: string[];
  }): Promise<{
    archiveName: string;
    fileStream: Readable;
  }> {
    const { fileIds, dirIds } = options;

    const archiveName = `download-${Date.now()}.zip`;

    const archive = archiver("zip", {
      zlib: { level: 5 },
      highWaterMark: 1024 * 1024,
    });

    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      passThrough.destroy(err);
    });

    try {
      await Promise.all(
        fileIds.map((fileId) => this._addFileToArchive(fileId, archive))
      );

      await Promise.all(
        dirIds.map((dirId) => this._addDirectoryToArchive(dirId, archive))
      );

      archive.finalize();
    } catch (err) {
      archive.abort();
      throw err;
    }

    return {
      archiveName,
      fileStream: passThrough,
    };
  }
}
