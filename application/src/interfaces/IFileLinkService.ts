import FileInfo from "../../../core/src/entities/FileInfo";
import FileLink from "../../../core/src/entities/FileLink";

export default interface IFileLinkService {
  generate(
    ownerId: string,
    fileInfoId: string,
    friends: string[],
    isPublic: boolean
  ): Promise<FileLink>;
  getById(id: string): Promise<FileLink>;
  getByLink(link: string): Promise<FileLink>;
  getAllByOwnerId(ownerId: string): Promise<FileLink[]>;
  getOrGenerate(
    ownerId: string,
    fileInfoId: string,
    friends: string[],
    isPublic: boolean
  ): Promise<FileLink>;
  getByFileInfoId(fileInfoId: string): Promise<FileLink>;
  download(link: string, userId: string): Promise<[FileInfo, string]>;
  addFriend(id: string, userId: string): Promise<FileLink>;
  removeFriend(id: string, userId: string): Promise<FileLink>;
  removeAllFriends(id: string): Promise<FileLink>;
  setPublicity(id: string, publicity: boolean): Promise<void>;
  delete(id: string): Promise<FileLink>;
}
