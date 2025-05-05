import { Readable, PassThrough } from "stream";
import archiver from "archiver";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileRepository from "../../../core/src/repositories/IFileRepository";
import { IEntityService } from "../interfaces/IEntityService";
import IFileService from "../interfaces/IFileService";
import IDirService from "../interfaces/IDirService";
import MoveCollisionError from "../errors/MoveCollisionError";

export class EntityService implements IEntityService {
  constructor(
    private readonly _dirInfoRepository: IDirInfoRepository,
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _fileRepository: IFileRepository,
    private readonly _fileService: IFileService,
    private readonly _dirService: IDirService
  ) {}

  async copyMultiple(options: {
    fileIds: string[];
    dirIds: string[];
    destinationId?: string;
  }): Promise<void> {
    const { fileIds, dirIds, destinationId } = options;

    fileIds.forEach((id) => this._fileService.copy(id, destinationId));
    dirIds.forEach((id) => this._dirService.copy(id, destinationId));
  }

  async moveMultiple(options: {
    fileIds: string[];
    dirIds: string[];
    destinationId?: string;
    overwrite?: boolean;
  }): Promise<{
    conflictingFiles: { movedId: string; originalId: string }[];
    conflictingDirs: { movedId: string; originalId: string }[];
  }> {
    const { fileIds, dirIds, destinationId, overwrite } = options;

    const conflictingFiles: { movedId: string; originalId: string }[] = [];
    const conflictingDirs: { movedId: string; originalId: string }[] = [];

    for (const id of fileIds) {
      try {
        await this._fileService.move({
          id,
          overwrite,
          destinationId,
        });
      } catch (error) {
        if (error instanceof MoveCollisionError) {
          conflictingFiles.push({
            movedId: id,
            originalId: error.conflictingId,
          });
        } else throw error;
      }
    }

    for (const id of dirIds) {
      try {
        await this._dirService.move({
          id,
          overwrite,
          destinationId,
        });
      } catch (error) {
        if (error instanceof MoveCollisionError) {
          conflictingDirs.push({
            movedId: id,
            originalId: error.conflictingId,
          });
        } else throw error;
      }
    }

    return {
      conflictingFiles,
      conflictingDirs,
    };
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
