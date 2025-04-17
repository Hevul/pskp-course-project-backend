import DirInfo from "../../../core/src/entities/DirInfo";
import FileInfo from "../../../core/src/entities/FileInfo";
import FileLink from "../../../core/src/entities/FileLink";
import UserStorage from "../../../core/src/entities/UserStorage";
import IDirInfoRepository from "../../../core/src/repositories/IDirInfoRepository";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileLinkRepository from "../../../core/src/repositories/IFileLinkRepository";
import IUserStorageRepository from "../../../core/src/repositories/IUserStorageRepository";
import { IAuthorizationService } from "../interfaces/IAuthorizationService";
import { EntityType } from "../interfaces/IAuthorizationService";

type EntityRepository =
  | IFileInfoRepository
  | IDirInfoRepository
  | IUserStorageRepository
  | IFileLinkRepository;

type Entity = FileInfo | DirInfo | UserStorage | FileLink;

export class AuthorizationService implements IAuthorizationService {
  constructor(
    private readonly fileInfoRepository: IFileInfoRepository,
    private readonly dirInfoRepository: IDirInfoRepository,
    private readonly userStorageRepository: IUserStorageRepository,
    private readonly fileLinkRepository: IFileLinkRepository
  ) {}

  private getRepository(entityType: EntityType): EntityRepository {
    switch (entityType) {
      case "file":
        return this.fileInfoRepository;
      case "dir":
        return this.dirInfoRepository;
      case "storage":
        return this.userStorageRepository;
      case "link":
        return this.fileLinkRepository;
      default:
        throw new Error("Unknown entity type");
    }
  }

  private async getOwnerId(
    entity: Entity,
    entityType: EntityType
  ): Promise<string> {
    switch (entityType) {
      case "file": {
        const fileInfo = entity as FileInfo;
        const storage = await this.userStorageRepository.get(fileInfo.storage);
        return storage.ownerId;
      }
      case "dir": {
        const dirInfo = entity as DirInfo;
        const storage = await this.userStorageRepository.get(dirInfo.storage);
        return storage.ownerId;
      }
      case "storage":
        return (entity as UserStorage).ownerId;
      case "link":
        return (entity as FileLink).ownerId;
    }
  }

  private async checkOwnership(
    userId: string,
    entityId: string,
    entityType: EntityType
  ): Promise<boolean> {
    const repository = this.getRepository(entityType);
    const entity = await repository.get(entityId);

    const ownerId = await this.getOwnerId(entity, entityType);

    return ownerId === userId;
  }

  async authorizeRequest(
    userId: string,
    entityIds: string[],
    entityType: EntityType
  ): Promise<void> {
    if (entityIds.length === 0) return;

    const repository = this.getRepository(entityType);

    for (const entityId of entityIds) {
      const entity = await repository.get(entityId);

      if (!entity) {
        throw new Error(`${entityType} with id ${entityId} not found`);
      }

      const ownerId = await this.getOwnerId(entity, entityType);

      if (ownerId !== userId) {
        throw new Error(`Access denied to ${entityType} ${entityId}`);
      }
    }
  }
}
