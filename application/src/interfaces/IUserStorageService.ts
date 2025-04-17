import UserStorage from "../../../core/src/entities/UserStorage";
import { UserStorageFullInfoDTO } from "../dtos/UserStorageFullInfoDTO";

export default interface IUserStorageService {
  create(name: string, ownerId: string): Promise<UserStorage>;
  get(id: string): Promise<UserStorage>;
  getAll(): Promise<UserStorage[]>;
  rename(id: string, name: string): Promise<UserStorage>;
  delete(id: string, force: boolean): Promise<UserStorage>;
  getFullInfo(id: string): Promise<UserStorageFullInfoDTO>;
}
