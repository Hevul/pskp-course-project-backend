import IUserStorageService from "../interfaces/IUserStorageService";
import IUserStorageRepository from "../../../core/src/repositories/IUserStorageRepository";
import IDirRepository from "../../../core/src/repositories/IDirRepository";
import UserStorage from "../../../core/src/entities/UserStorage";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import UserStorageNotEmptyError from "../errors/UserStorageNotEmptyError";
import { UserStorageFullInfoDTO } from "../dtos/UserStorageFullInfoDTO";
import IFileLinkRepository from "../../../core/src/repositories/IFileLinkRepository";

class UserStorageService implements IUserStorageService {
  constructor(
    private readonly _userStorageRepository: IUserStorageRepository,
    private readonly _dirRepository: IDirRepository,
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _dirInfoRepository: IDirInfoRepository,
    private readonly _fileLinkRepository: IFileLinkRepository
  ) {}

  async getFullInfo(id: string): Promise<UserStorageFullInfoDTO> {
    const storage = await this._userStorageRepository.get(id);

    const files = (await this._fileInfoRepository.getAll()).filter(
      (f) => f.storage === storage.id
    );
    const dirs = (await this._dirInfoRepository.getAll()).filter(
      (d) => d.storage === storage.id
    );

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      name: storage.name,
      size: totalSize,
      fileCount: files.length,
      dirCount: dirs.length,
    };
  }

  async delete(id: string, force: boolean = false): Promise<UserStorage> {
    let storage = await this._userStorageRepository.get(id);

    const storageFiles = (await this._fileInfoRepository.getAll()).filter(
      (f) => f.storage === storage.id
    );
    const storageDirs = (await this._dirInfoRepository.getAll()).filter(
      (d) => d.storage === storage.id
    );

    if (!force) {
      const hasStorageChild = storageFiles.length + storageDirs.length > 0;

      if (hasStorageChild) throw new UserStorageNotEmptyError();
    }

    await Promise.all(
      storageFiles.map((f) => this._fileLinkRepository.deleteByFileInfoId(f.id))
    );
    await Promise.all(
      storageFiles.map((f) => this._fileInfoRepository.delete(f.id))
    );
    await Promise.all(
      storageDirs.map((d) => this._dirInfoRepository.delete(d.id))
    );

    storage = await this._userStorageRepository.delete(id);

    await this._dirRepository.rm(`/${storage.id}`);

    return storage;
  }

  async rename(id: string, name: string): Promise<UserStorage> {
    const storage = await this._userStorageRepository.get(id);

    storage.name = name;

    return await this._userStorageRepository.update(storage);
  }

  async create(name: string, ownerId: string): Promise<UserStorage> {
    let storage = new UserStorage(name, ownerId);

    storage = await this._userStorageRepository.add(storage);

    await this._dirRepository.mkdir(`/${storage.id}`);

    return storage;
  }

  async get(id: string): Promise<UserStorage> {
    return this._userStorageRepository.get(id);
  }

  async getAll(): Promise<UserStorage[]> {
    return this._userStorageRepository.getAll();
  }
}

export default UserStorageService;
