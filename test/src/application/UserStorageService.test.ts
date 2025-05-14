import { promises as fs } from "fs";
import {
  DIR_NAME,
  FAKE_STORAGE_ID,
  FAKE_USER_ID,
  FILE_NAME,
  FILE_SIZE,
  LOGIN,
  PASSWORD,
  PHYSICAL_FILE_ID,
  STORAGE_NAME,
  STORAGE_NEW_NAME,
} from "../utils/constants";
import { USER_STORAGE_SERVICE_DB } from "../utils/dbs";
import { USER_STORAGE_SERVICE_LS } from "../utils/localStorages";
import {
  connect,
  DirInfo,
  DirInfoDb,
  DirInfoRepository,
  DirRepository,
  FileInfo,
  FileInfoDb,
  FileInfoRepository,
  FileLinkRepository,
  FileRepository,
  IFileLinkRepository,
  User,
  UserDb,
  UserNotFoundError,
  UserRepository,
  UserStorageDb,
  UserStorageNotFoundError,
  UserStorageRepository,
  UserStorageService,
} from "../utils/imports";
import mongoose from "mongoose";
import UserStorageNotEmptyError from "../../../application/src/errors/UserStorageNotEmptyError";
import "../utils/customMatchers";

describe("UserStorageService", () => {
  let userStorageRepository: UserStorageRepository;
  let dirRepository: DirRepository;
  let userRepository: UserRepository;
  let fileInfoRepository: FileInfoRepository;
  let dirInfoRepository: DirInfoRepository;
  let fileLinkRepository: IFileLinkRepository;

  let userStorageService: UserStorageService;

  beforeAll(async () => {
    await connect(USER_STORAGE_SERVICE_DB);

    dirRepository = new DirRepository(USER_STORAGE_SERVICE_LS);
    userStorageRepository = new UserStorageRepository();
    userRepository = new UserRepository();
    fileInfoRepository = new FileInfoRepository();
    dirInfoRepository = new DirInfoRepository();
    fileLinkRepository = new FileLinkRepository();

    userStorageService = new UserStorageService(
      userStorageRepository,
      dirRepository,
      fileInfoRepository,
      dirInfoRepository,
      fileLinkRepository
    );
  });

  beforeEach(async () => {
    await fs.mkdir(USER_STORAGE_SERVICE_LS);
  });

  afterEach(async () => {
    await fs.rm(USER_STORAGE_SERVICE_LS, { recursive: true, force: true });
    await UserDb.deleteMany({});
    await UserStorageDb.deleteMany({});
    await DirInfoDb.deleteMany({});
    await FileInfoDb.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const createUserAndStorage = async () => {
    const user = await userRepository.add(new User(LOGIN, PASSWORD));
    const storage = await userStorageService.create(STORAGE_NAME, user.id);
    return { user, storage };
  };

  it(`creates userStorage in db and in a local storage`, async () => {
    // ASSIGN
    const user = await userRepository.add(new User(LOGIN, PASSWORD));

    // ACT
    const storage = await userStorageService.create(STORAGE_NAME, user.id);

    // ASSERT
    expect(storage.id).toExistInDatabase(userStorageRepository);
    expect(`/${storage.id}`).toExistInStorage(dirRepository);
  });

  it(`returns userStorage
      when userStorage exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    // ACT
    const foundStorage = await userStorageService.get(storage.id);

    // ASSERT
    expect(foundStorage).toEqual(storage);
  });

  it(`throws UserStorageNotFoundError
      when attempting to get non-existing userStorage`, async () => {
    await expect(userStorageService.get(FAKE_STORAGE_ID)).rejects.toThrow(
      UserStorageNotFoundError
    );
  });

  it(`renames userStorage
      when userStorage exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    // ACT
    const renamedStorage = await userStorageService.rename(
      storage.id,
      STORAGE_NEW_NAME
    );

    // ASSERT
    expect(renamedStorage.name).toBe(STORAGE_NEW_NAME);
    expect(renamedStorage.id).toBe(storage.id);
  });

  it(`throws UserStorageNotFoundError
      when attempting to rename non-existing userStorage`, async () => {
    await expect(
      userStorageService.rename(FAKE_STORAGE_ID, STORAGE_NEW_NAME)
    ).rejects.toThrow(UserStorageNotFoundError);
  });

  it(`deletes empty userStorage`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    // ACT
    await userStorageService.delete(storage.id);

    // ASSERT
    expect(storage.id).not.toExistInDatabase(userStorageRepository);
    expect(`/${storage.id}`).not.toExistInStorage(dirRepository);
  });

  it(`throws UserStorageNotEmptyError
      when attempting to delete not empty userStorage without force mode`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirInfoRepository.add(
      new DirInfo(DIR_NAME, new Date(), storage.id)
    );

    // ACT
    // ASSERT
    await expect(userStorageService.delete(storage.id)).rejects.toThrow(
      UserStorageNotEmptyError
    );
  });

  it(`deletes not empty userStorage with force mode`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await fileInfoRepository.add(
      new FileInfo({
        name: FILE_NAME,
        uploadAt: new Date(),
        size: FILE_SIZE,
        storage: storage.id,
        physicalFileId: PHYSICAL_FILE_ID,
      })
    );
    const dir = await dirInfoRepository.add(
      new DirInfo(DIR_NAME, new Date(), storage.id)
    );

    // ACT
    await userStorageService.delete(storage.id, true);

    // ASSERT
    expect(`/${storage.id}`).not.toExistInStorage(dirRepository);
    expect(storage.id).not.toExistInDatabase(userStorageRepository);
    expect(dir.id).not.toExistInDatabase(dirInfoRepository);
    expect(file.id).not.toExistInDatabase(fileInfoRepository);
  });
});
