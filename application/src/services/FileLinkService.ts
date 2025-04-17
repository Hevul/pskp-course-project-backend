import FileInfo from "../../../core/src/entities/FileInfo";
import FileLink from "../../../core/src/entities/FileLink";
import IFileInfoRepository from "../../../core/src/repositories/IFileInfoRepository";
import IFileLinkRepository from "../../../core/src/repositories/IFileLinkRepository";
import IUserRepository from "../../../core/src/repositories/IUserRepository";
import LinkAccessDeniedError from "../errors/LinkAccessDeniedError";
import LinkAlreadyExistsError from "../errors/LinkAlreadyExists";
import IFileLinkService from "../interfaces/IFileLinkService";
import IHashProvider from "../interfaces/IHashProvider";

export class FileLinkService implements IFileLinkService {
  constructor(
    private readonly _fileLinkRepository: IFileLinkRepository,
    private readonly _fileInfoRepository: IFileInfoRepository,
    private readonly _userRepository: IUserRepository,
    private readonly _hashProvider: IHashProvider
  ) {}

  async getById(id: string): Promise<FileLink> {
    const link = await this._fileLinkRepository.get(id);
    return link;
  }

  async getByLink(link: string): Promise<FileLink> {
    const fileLink = await this._fileLinkRepository.getByLink(link);
    return fileLink;
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

    await this._fileLinkRepository.update(link);

    return link;
  }

  async generate(
    ownerId: string,
    fileInfoId: string,
    friends: string[],
    isPublic: boolean
  ): Promise<FileLink> {
    const exists = await this._fileLinkRepository.existsByFileId(fileInfoId);

    if (exists) throw new LinkAlreadyExistsError();

    const link = this._hashProvider.generate(`${ownerId}.${fileInfoId}`);

    let fileLink = new FileLink(link, ownerId, fileInfoId, friends, isPublic);

    fileLink = await this._fileLinkRepository.add(fileLink);

    return fileLink;
  }

  async download(link: string, userId: string): Promise<[FileInfo, string]> {
    const fileLink = await this._fileLinkRepository.getByLink(link);

    if (fileLink.isPrivate) {
      const isFriend = fileLink.friends.includes(userId);
      const isOwner = fileLink.ownerId === userId;

      if (!isFriend && !isOwner) throw new LinkAccessDeniedError();
    }

    const fileInfo = await this._fileInfoRepository.get(fileLink.fileInfoId);

    const pathname = await this._fileInfoRepository.getPathname(fileInfo.id);

    return [fileInfo, pathname];
  }

  async getOrGenerate(
    ownerId: string,
    fileInfoId: string,
    friends: string[],
    isPublic: boolean
  ): Promise<FileLink> {
    const exists = await this._fileLinkRepository.existsByFileId(fileInfoId);

    if (exists) return await this.getByFileInfoId(fileInfoId);

    return await this.generate(ownerId, fileInfoId, friends, isPublic);
  }
}
