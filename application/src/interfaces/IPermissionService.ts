export default interface IPermissionService {
  accessToStorage(storageId: string, userId: string): Promise<boolean>;
  accessToFile(fileInfoId: string, userId: string): Promise<boolean>;
  accessToDirectory(dirInfoId: string, userId: string): Promise<boolean>;
}
