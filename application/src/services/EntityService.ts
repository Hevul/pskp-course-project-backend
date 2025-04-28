import { Readable, PassThrough } from "stream";
import archiver from "archiver";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileRepository from "../../../core/src/repositories/IFileRepository";
import { IEntityService } from "../interfaces/IEntityService";
import DirInfo from "../../../core/src/entities/DirInfo";
import FileInfo from "../../../core/src/entities/FileInfo";

export class EntityService implements IEntityService {
  constructor(
    private readonly dirInfoRepository: IDirInfoRepository,
    private readonly fileInfoRepository: IFileInfoRepository,
    private readonly fileRepository: IFileRepository
  ) {}

  private async _addFileToArchive(
    fileId: string,
    archive: archiver.Archiver,
    pathPrefix: string = ""
  ): Promise<void> {
    try {
      const file = await this.fileInfoRepository.get(fileId);
      const fileStream = await this.fileRepository.getStream(
        `/${file.storage}/${file.id}`
      );
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
      const dir = await this.dirInfoRepository.get(dirId);

      // Добавляем запись о директории
      archive.append("", { name: `${pathPrefix}${dir.name}/` });

      // Добавляем файлы из директории
      const files = await this.fileInfoRepository.find({ parent: dirId });
      await Promise.all(
        files.map((file) =>
          this._addFileToArchive(file.id, archive, `${pathPrefix}${dir.name}/`)
        )
      );

      // Рекурсивно добавляем поддиректории
      const subDirs = await this.dirInfoRepository.find({ parent: dirId });
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
      // Добавляем файлы верхнего уровня
      await Promise.all(
        fileIds.map((fileId) => this._addFileToArchive(fileId, archive))
      );

      // Добавляем директории верхнего уровня
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
