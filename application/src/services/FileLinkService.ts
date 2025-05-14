import { FileInfo } from "../../../core/src/entities/FileInfo";
import FileLink from "../../../core/src/entities/FileLink";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileLinkRepository from "../../../core/src/repositories/IFileLinkRepository";
import IUserRepository from "../../../core/src/repositories/IUserRepository";
import IUserStorageRepository from "../../../core/src/repositories/IUserStorageRepository";
import { FileLinkFullInfoDTO } from "../dtos/FileLinkFullInfoDTO";
import LinkAccessDeniedError from "../errors/LinkAccessDeniedError";
import LinkAlreadyExistsError from "../errors/LinkAlreadyExists";
import IFileLinkService from "../interfaces/IFileLinkService";
import IHashProvider from "../interfaces/IHashProvider";

export class FileLinkService implements IFileLinkService {
  constructor(
    private readonly _userStorageRepository: IUserStorageRepository,
    private readonly _fileLinkRepository: IFileLinkRepository,
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _userRepository: IUserRepository,
    private readonly _hashProvider: IHashProvider
  ) {}

  async checkAccess(
    identifier: string | { id: string } | { link: string },
    userId: string
  ): Promise<void> {
    let fileLink: FileLink;
    if (typeof identifier === "string") {
      fileLink = await this._fileLinkRepository.getByLink(identifier);
    } else if ("id" in identifier) {
      fileLink = await this._fileLinkRepository.get(identifier.id);
    } else if ("link" in identifier) {
      fileLink = await this._fileLinkRepository.getByLink(identifier.link);
    } else {
      throw new Error("Invalid identifier type");
    }

    if (
      fileLink.isPublic ||
      fileLink.ownerId === userId ||
      fileLink.friends.includes(userId)
    ) {
      return;
    }

    throw new LinkAccessDeniedError();
  }

  async getFullInfo(id: string): Promise<FileLinkFullInfoDTO> {
    const link = await this._fileLinkRepository.get(id);
    const file = await this._fileInfoRepository.get(link.fileInfoId);
    const user = await this._userRepository.getById(link.ownerId);
    const path = await this._fileInfoRepository.getPathname(file.id);
    const storage = await this._userStorageRepository.get(file.storage);

    const pathParts = path.split("/");
    if (pathParts.length > 1) pathParts[1] = storage.name;
    const clearedPath = pathParts.join("/");

    return {
      filename: file.name,
      size: file.size,
      owner: user.login,
      createAt: link.createAt,
      downloadCount: link.downloadCount,
      path: clearedPath,
      name: link.name,
      description: link.description,
    };
  }

  async getById(id: string): Promise<FileLink> {
    const link = await this._fileLinkRepository.get(id);
    return link;
  }

  async getByLink(link: string): Promise<[FileLink, FileInfo]> {
    const fileLink = await this._fileLinkRepository.getByLink(link);
    const fileInfo = await this._fileInfoRepository.get(fileLink.fileInfoId);
    return [fileLink, fileInfo];
  }

  async getAllByOwnerId(ownerId: string): Promise<FileLink[]> {
    const links = await this._fileLinkRepository.getAllByOwnerId(ownerId);
    return links;
  }

  async getByFileInfoId(fileInfoId: string): Promise<FileLink> {
    const link = await this._fileLinkRepository.getByFileInfoId(fileInfoId);
    return link;
  }

  async delete(id: string): Promise<FileLink> {
    let link = await this._fileLinkRepository.get(id);
    await this._fileLinkRepository.delete(id);
    return link;
  }

  async setPublicity(id: string, publicity: boolean): Promise<void> {
    let link = await this._fileLinkRepository.get(id);
    link.setPublicity(publicity);
    await this._fileLinkRepository.update(link);
  }

  async removeFriend(id: string, userId: string): Promise<FileLink> {
    const user = await this._userRepository.getById(userId);

    let link = await this._fileLinkRepository.get(id);
    link.removeFriend(user.id);
    await this._fileLinkRepository.update(link);

    return link;
  }

  async removeAllFriends(id: string): Promise<FileLink> {
    let link = await this._fileLinkRepository.get(id);

    link.friends = [];
    await this._fileLinkRepository.update(link);

    return link;
  }

  async addFriend(id: string, friendName: string): Promise<FileLink> {
    const user = await this._userRepository.getByLogin(friendName);

    let link = await this._fileLinkRepository.get(id);
    link.addFriend(user.id);

    return await this._fileLinkRepository.update(link);
  }

  async generate(ownerId: string, fileInfoId: string): Promise<FileLink> {
    const exists = await this._fileLinkRepository.existsByFileId(fileInfoId);
    if (exists) throw new LinkAlreadyExistsError();

    const link = this._hashProvider.generate(`${ownerId}.${fileInfoId}`);
    let fileLink = new FileLink({ link, ownerId, fileInfoId });
    fileLink = await this._fileLinkRepository.add(fileLink);

    return fileLink;
  }

  async download(link: string, userId: string): Promise<[FileInfo, string]> {
    const fileLink = await this._fileLinkRepository.getByLink(link);
    const fileInfo = await this._fileInfoRepository.get(fileLink.fileInfoId);

    const pathname = fileInfo.path();

    fileLink.downloadCount++;
    await this._fileLinkRepository.update(fileLink);

    return [fileInfo, pathname];
  }

  async updateName(id: string, name: string): Promise<FileLink> {
    const fileLink = await this._fileLinkRepository.get(id);
    fileLink.name = name;
    return await this._fileLinkRepository.update(fileLink);
  }

  async updateDescription(id: string, description: string): Promise<FileLink> {
    const fileLink = await this._fileLinkRepository.get(id);
    fileLink.description = description;
    return await this._fileLinkRepository.update(fileLink);
  }
}
