import FileLink from "../entities/FileLink";

export default interface IFileLinkRepository {
  exists(id: string): Promise<boolean>;
  existsByFileId(fileId: string): Promise<boolean>;
  get(id: string): Promise<FileLink>;
  getAllByOwnerId(ownerId: string): Promise<FileLink[]>;
  getByFileInfoId(fileInfoId: string): Promise<FileLink>;
  getByLink(link: string): Promise<FileLink>;
  add(fileLink: FileLink): Promise<FileLink>;
  delete(id: string): Promise<FileLink>;
  deleteByFileInfoId(fileInfoId: string): Promise<void>;
  update(fileLink: FileLink): Promise<FileLink>;
}
