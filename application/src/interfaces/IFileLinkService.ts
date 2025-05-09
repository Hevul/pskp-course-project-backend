import FileInfo from "../../../core/src/entities/FileInfo";
import FileLink from "../../../core/src/entities/FileLink";
import { FileLinkFullInfoDTO } from "../dtos/FileLinkFullInfoDTO";

export default interface IFileLinkService {
  generate(ownerId: string, fileInfoId: string): Promise<FileLink>;
  getById(id: string): Promise<FileLink>;
  getByLink(link: string): Promise<[FileLink, FileInfo]>;
  getAllByOwnerId(ownerId: string): Promise<FileLink[]>;
  getByFileInfoId(fileInfoId: string): Promise<FileLink>;
  download(link: string, userId: string): Promise<[FileInfo, string]>;
  addFriend(id: string, userId: string): Promise<FileLink>;
  removeFriend(id: string, userId: string): Promise<FileLink>;
  removeAllFriends(id: string): Promise<FileLink>;
  setPublicity(id: string, publicity: boolean): Promise<void>;
  delete(id: string): Promise<FileLink>;
  getFullInfo(id: string): Promise<FileLinkFullInfoDTO>;
  checkAccess(
    identifier: string | { id: string } | { link: string },
    userId: string
  ): Promise<void>;
  updateName(id: string, name: string): Promise<FileLink>;
  updateDescription(id: string, description: string): Promise<FileLink>;
}
