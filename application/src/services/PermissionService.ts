import DirInfo from "../../../core/src/entities/DirInfo";
import FileInfo from "../../../core/src/entities/FileInfo";
import User from "../../../core/src/entities/User";
import UserStorage from "../../../core/src/entities/UserStorage";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IUserRepository from "../../../core/src/repositories/IUserRepository";
import IUserStorageRepository from "../../../core/src/repositories/IUserStorageRepository";
import IPermissionService from "../interfaces/IPermissionService";

class PermissionService implements IPermissionService {
  constructor(
    private readonly _userStorageRepository: IUserStorageRepository,
    private readonly _userRepository: IUserRepository,
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _dirInfoRepository: IDirInfoRepository
  ) {}

  async accessToStorage(storageId: string, userId: string): Promise<boolean> {
    let user: User;
    let storage: UserStorage;

    try {
      user = await this._userRepository.getById(userId);
      storage = await this._userStorageRepository.get(storageId);
    } catch {
      return false;
    }

    const haveAccess = storage.ownerId === user.id;

    return haveAccess;
  }

  async accessToFile(fileInfoId: string, userId: string): Promise<boolean> {
    let user: User;
    let storage: UserStorage;
    let fileInfo: FileInfo;

    try {
      user = await this._userRepository.getById(userId);
      fileInfo = await this._fileInfoRepository.get(fileInfoId);
      storage = await this._userStorageRepository.get(fileInfo.storage);
    } catch {
      return false;
    }

    const haveAccess = storage.ownerId === user.id;

    return haveAccess;
  }

  async accessToDirectory(dirInfoId: string, userId: string): Promise<boolean> {
    let user: User;
    let storage: UserStorage;
    let dir: DirInfo;

    try {
      user = await this._userRepository.getById(userId);
      dir = await this._dirInfoRepository.get(dirInfoId);
      storage = await this._userStorageRepository.get(dir.storage);
    } catch {
      return false;
    }

    const haveAccess = storage.ownerId === user.id;

    return haveAccess;
  }
}

export default PermissionService;
