import DirInfo from "../../../core/src/entities/DirInfo";
import IDirService from "../interfaces/IDirService";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import DirectoryMoveInChildError from "../errors/DirectoryMoveInChildError";
import DirectoryMoveInItSelfError from "../errors/DirectoryMoveInItSelfError";
import MoveCollisionError from "../errors/MoveCollisionError";
import CopyCollisionError from "../errors/CopyCollisionError";
import { DirInfoFullInfoDTO } from "../dtos/DirInfoFullInfoDTO";
import CreateCollisionError from "../errors/CreateCollisionError";
import FileInfo from "../../../core/src/entities/FileInfo";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileRepository from "../../../core/src/repositories/IFileRepository";
import RenameCollisionError from "../errors/RenameCollisionError";
import { finished } from "stream/promises";
import { Readable, PassThrough } from "stream";
import archiver from "archiver";

class DirService implements IDirService {
  constructor(
    private readonly _dirInfoRepository: IDirInfoRepository,
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _fileRepository: IFileRepository
  ) {}

  private async _getChildrenNames(
    parentId: string | undefined,
    storageId: string,
    isDir: boolean
  ): Promise<string[]> {
    if (isDir) {
      const dirs = await this._dirInfoRepository.find({
        parent: parentId,
        storage: storageId,
      });
      return dirs.map((d) => d.name);
    } else {
      const files = await this._fileInfoRepository.find({
        parent: parentId,
        storage: storageId,
      });
      return files.map((f) => f.name);
    }
  }

  private async _checkNameCollision(
    name: string,
    parentId: string | undefined,
    storageId: string,
    operationType: "create" | "move" | "copy" | "rename" = "create"
  ): Promise<void> {
    const [existingDirs, existingFiles] = await Promise.all([
      this._getChildrenNames(parentId, storageId, true),
      this._getChildrenNames(parentId, storageId, false),
    ]);

    if (existingDirs.includes(name) || existingFiles.includes(name)) {
      switch (operationType) {
        case "move":
          throw new MoveCollisionError();
        case "copy":
          throw new CopyCollisionError();
        case "rename":
          throw new RenameCollisionError();
        case "create":
        default:
          throw new CreateCollisionError();
      }
    }
  }

  async getFullInfo(id: string): Promise<DirInfoFullInfoDTO> {
    const dirInfo = await this._dirInfoRepository.get(id);

    const [counts, size, path] = await Promise.all([
      this._dirInfoRepository.getRecursiveCounts(id),
      this._dirInfoRepository.getSize(id),
      this._dirInfoRepository.getPath(id),
    ]);

    const cleanPath = path.replace(/^\/[a-f0-9]+/, "");

    return {
      name: dirInfo.name,
      createAt: dirInfo.uploadAt,
      fileCount: counts.fileCount,
      dirCount: counts.dirCount,
      size: size,
      path: cleanPath,
    };
  }

  async getAllByStorageId(storageId: string): Promise<DirInfo[]> {
    return this._dirInfoRepository.find({ storage: storageId });
  }

  async move(id: string, destinationId?: string): Promise<DirInfo> {
    let movedDir = await this._dirInfoRepository.get(id);

    if (id === destinationId) throw new DirectoryMoveInItSelfError();

    if (destinationId) {
      const destinationPath = await this._dirInfoRepository.getPath(
        destinationId
      );
      const currentPath = await this._dirInfoRepository.getPath(id);
      if (destinationPath.startsWith(`${currentPath}/`)) {
        throw new DirectoryMoveInChildError();
      }
    }

    await this._checkNameCollision(
      movedDir.name,
      destinationId,
      movedDir.storage,
      "move"
    );

    movedDir.parent = destinationId;
    return this._dirInfoRepository.update(movedDir);
  }

  async copy(id: string, destinationId?: string): Promise<DirInfo> {
    const sourceDir = await this._dirInfoRepository.get(id);

    if (id === destinationId) throw new DirectoryMoveInItSelfError();

    await this._checkNameCollision(
      sourceDir.name,
      destinationId,
      sourceDir.storage,
      "copy"
    );

    const newDir = new DirInfo(
      sourceDir.name,
      new Date(),
      sourceDir.storage,
      destinationId
    );
    const createdDir = await this._dirInfoRepository.add(newDir);

    await this._copyDirectoryContents(id, createdDir.id);

    return createdDir;
  }

  private async _copyDirectoryContents(
    sourceDirId: string,
    targetDirId: string
  ): Promise<void> {
    const files = await this._fileInfoRepository.find({
      parent: sourceDirId,
    });
    await Promise.all(
      files.map(async (file) => {
        const newFile = new FileInfo(
          file.name,
          new Date(),
          file.size,
          file.storage,
          targetDirId
        );
        const createdFile = await this._fileInfoRepository.add(newFile);

        await this._fileRepository.copy(
          this._getFilePath(file),
          this._getFilePath(createdFile)
        );
      })
    );

    const subDirs = await this._dirInfoRepository.find({
      parent: sourceDirId,
    });
    await Promise.all(
      subDirs.map(async (dir) => {
        const newSubDir = new DirInfo(
          dir.name,
          new Date(),
          dir.storage,
          targetDirId
        );
        const createdSubDir = await this._dirInfoRepository.add(newSubDir);
        await this._copyDirectoryContents(dir.id, createdSubDir.id);
      })
    );
  }

  private _getFilePath(file: FileInfo): string {
    return `/${file.storage}/${file.id}`;
  }

  async getSize(id: string): Promise<number> {
    return this._dirInfoRepository.getSize(id);
  }

  async rename(id: string, name: string): Promise<DirInfo> {
    const dir = await this._dirInfoRepository.get(id);

    await this._checkNameCollision(name, dir.parent, dir.storage, "rename");

    dir.name = name;
    return await this._dirInfoRepository.update(dir);
  }

  async delete(id: string): Promise<DirInfo> {
    const dirInfo = await this._dirInfoRepository.get(id);

    await this._deleteDirectoryContents(id);

    await this._dirInfoRepository.delete(id);

    return dirInfo;
  }

  private async _deleteDirectoryContents(dirId: string): Promise<void> {
    const files = await this._fileInfoRepository.find({ parent: dirId });

    await Promise.all(
      files.map(async (file) => {
        try {
          await this._fileRepository.rm(this._getFilePath(file));
          await this._fileInfoRepository.delete(file.id);
        } catch (error) {
          console.error(`Failed to delete file ${file.id}:`, error);
        }
      })
    );

    const subDirs = await this._dirInfoRepository.find({ parent: dirId });
    await Promise.all(
      subDirs.map(async (dir) => {
        try {
          await this._deleteDirectoryContents(dir.id);
          await this._dirInfoRepository.delete(dir.id);
        } catch (error) {
          console.error(`Failed to delete subdirectory ${dir.id}:`, error);
        }
      })
    );
  }

  async create(
    name: string,
    storageId: string,
    parentId?: string
  ): Promise<DirInfo> {
    await this._checkNameCollision(name, parentId, storageId, "create");

    const dir = new DirInfo(name, new Date(), storageId, parentId);
    return this._dirInfoRepository.add(dir);
  }

  async download(id: string): Promise<{ stream: Readable; size: number }> {
    const dir = await this._dirInfoRepository.get(id);
    const archive = archiver("zip", { zlib: { level: 6 } });
    const passThrough = new PassThrough();

    let totalSize = 0;
    let fileCount = 0;

    // Обработчики ошибок
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      passThrough.emit("error", err);
    });

    archive.pipe(passThrough);

    // Рекурсивная функция добавления файлов и директорий
    const addFilesToArchive = async (dirId: string, pathPrefix = "") => {
      const [files, subDirs] = await Promise.all([
        this._fileInfoRepository.find({ parent: dirId }),
        this._dirInfoRepository.find({ parent: dirId }),
      ]);

      // Добавляем файлы текущей директории
      await Promise.all(
        files.map(async (file) => {
          try {
            const fileStream = await this._fileRepository.getStream(
              this._getFilePath(file)
            );

            // Ждём завершения записи файла в архив
            archive.append(fileStream, {
              name: `${pathPrefix}${file.name}`,
            });

            // Увеличиваем общий размер и количество файлов
            totalSize += file.size;
            fileCount++;

            // Убедимся, что поток завершён
            await finished(fileStream);
          } catch (err) {
            console.error(`Error adding file ${file.name}:`, err);
          }
        })
      );

      // Рекурсивно обрабатываем поддиректории
      await Promise.all(
        subDirs.map(async (subDir) => {
          await addFilesToArchive(subDir.id, `${pathPrefix}${subDir.name}/`);
        })
      );
    };

    try {
      // Рекурсивно добавляем все файлы и директории
      await addFilesToArchive(id, `${dir.name}/`);

      console.log("Pre finalize");

      // Завершаем архив
      archive.finalize();

      console.log(
        `Archive created. Files: ${fileCount}, Total size: ${totalSize} bytes`
      );

      return { stream: passThrough, size: totalSize };
    } catch (err) {
      archive.abort();
      console.error("Failed to create archive:", err);
      throw err;
    }
  }
}

export default DirService;
