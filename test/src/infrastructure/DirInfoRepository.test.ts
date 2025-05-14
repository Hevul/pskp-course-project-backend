import { DIR_INFO_REPOSITORY_DB } from "../utils/dbs";
import {
  DIR_NAME,
  FAKE_DIR_ID,
  LOGIN,
  PASSWORD,
  STORAGE_NAME,
  SUB_SUBDIR_NAME,
  SUBDIR_NAME,
} from "../utils/constants";
import {
  connect,
  DirInfo,
  DirInfoAlreadyExistsError,
  DirInfoDb,
  DirInfoNotFoundError,
  DirInfoRepository,
  FileInfoDb,
  User,
  UserDb,
  UserRepository,
  UserStorage,
  UserStorageRepository,
} from "../utils/imports";
import mongoose from "mongoose";

describe.only("DirInfoRepository", () => {
  const uploadAt = new Date();

  let dirInfoRepository: DirInfoRepository;
  let userRepository: UserRepository;
  let userStorageRepository: UserStorageRepository;

  beforeAll(async () => {
    await connect(DIR_INFO_REPOSITORY_DB);
    dirInfoRepository = new DirInfoRepository();
    userRepository = new UserRepository();
    userStorageRepository = new UserStorageRepository();

    await DirInfoDb.deleteMany({});
    await FileInfoDb.deleteMany({});
    await UserDb.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await DirInfoDb.deleteMany({});
    await FileInfoDb.deleteMany({});
    await UserDb.deleteMany({});
  });

  const createUserAndStorage = async () => {
    const user = await userRepository.add(new User(LOGIN, PASSWORD));
    const storage = await userStorageRepository.add(
      new UserStorage(STORAGE_NAME, user.id)
    );
    return { user, storage };
  };

  const createDirInfo = async (
    storage: UserStorage,
    options?: { name?: string; parentId?: string }
  ) => {
    const name = options?.name || DIR_NAME;
    const parentId = options?.parentId;

    let dirInfo = new DirInfo(name, uploadAt, storage.id, parentId);
    dirInfo = await dirInfoRepository.add(dirInfo);

    return dirInfo;
  };

  it(`adds directory in storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    // ACT
    const dirInfo = await createDirInfo(storage);

    // ASSERT
    expect(dirInfo).toBeInstanceOf(DirInfo);
    expect(dirInfo.parent).toBeUndefined();
    expect(dirInfo.name).toBe(DIR_NAME);
    expect(dirInfo.storage).toBe(storage.id);
    expect(dirInfo.uploadAt).toBe(uploadAt);
  });

  it(`adds subdirectory
      when directory exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await createDirInfo(storage);

    // ACT
    let subdir = new DirInfo(SUBDIR_NAME, uploadAt, storage.id, dir.id);
    subdir = await dirInfoRepository.add(subdir);

    // ASSERT
    const exists = await dirInfoRepository.exists(subdir.id);

    expect(exists).toBe(true);
    expect(subdir.parent).toBe(dir.id);
  });

  it(`throws DirInfoAlreadyExistsError
      when attempting to add directory with the same name in storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await createDirInfo(storage);

    // ACT
    // ASSERT
    await expect(dirInfoRepository.add(dir)).rejects.toThrow(
      DirInfoAlreadyExistsError
    );
  });

  it(`throws DirInfoAlreadyExistsError
      when attempting to add 2 subdirectories with the same names in directory`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await createDirInfo(storage);

    const subdir = new DirInfo(SUBDIR_NAME, uploadAt, storage.id, dir.id);
    await dirInfoRepository.add(subdir);

    // ACT
    // ASSERT
    await expect(dirInfoRepository.add(subdir)).rejects.toThrow(
      DirInfoAlreadyExistsError
    );
  });

  it(`returns dirInfo
      when dirInfo exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await createDirInfo(storage);

    // ACT
    const foundDir = await dirInfoRepository.get(dir.id);

    // ASSERT
    expect(foundDir.id).toBe(dir.id);
    expect(foundDir.name).toBe(dir.name);
    expect(foundDir.parent).toBe(dir.parent);
    expect(foundDir.uploadAt).toEqual(dir.uploadAt);
    expect(foundDir.storage).toBe(dir.storage);
  });

  it(`throws DirInfoNotFoundError
      when attempting to get non-existing dirInfo`, async () => {
    await expect(dirInfoRepository.get(FAKE_DIR_ID)).rejects.toThrow(
      DirInfoNotFoundError
    );
  });

  it(`returns true
      when dirInfo exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await createDirInfo(storage);

    // ACT
    const exists = await dirInfoRepository.exists(dir.id);

    // ASSERT
    expect(exists).toBe(true);
  });

  it(`returns false
      when dirInfo doesn't exist`, async () => {
    // ACT
    const exists = await dirInfoRepository.exists(FAKE_DIR_ID);

    // ASSERT
    expect(exists).toBe(false);
  });

  it(`returns absolute directory path`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await createDirInfo(storage);
    const subdir = await createDirInfo(storage, {
      name: SUBDIR_NAME,
      parentId: dir.id,
    });
    const subSubdir = await createDirInfo(storage, {
      name: SUB_SUBDIR_NAME,
      parentId: subdir.id,
    });

    // ACT
    const dirPath = await dirInfoRepository.getPath(dir.id);
    const subdirPath = await dirInfoRepository.getPath(subdir.id);
    const subSubdirPath = await dirInfoRepository.getPath(subSubdir.id);

    // ASSERT
    expect(dirPath).toBe(`/${storage.id}/${dir.name}`);
    expect(subdirPath).toBe(`/${storage.id}/${dir.name}/${subdir.name}`);
    expect(subSubdirPath).toBe(
      `/${storage.id}/${dir.name}/${subdir.name}/${subSubdir.name}`
    );
  });

  it(`deletes dirInfo
      when dirInfo exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await createDirInfo(storage);

    // ACT
    await dirInfoRepository.delete(dir.id);

    // ASSERT
    const exists = await dirInfoRepository.exists(dir.id);

    expect(exists).toBe(false);
  });

  it(`deletes dirInfo
      when dirInfo has child`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await createDirInfo(storage);
    const subdir = await createDirInfo(storage, {
      name: SUBDIR_NAME,
      parentId: dir.id,
    });

    // ACT
    await dirInfoRepository.delete(dir.id);

    // ASSERT
    const dirExists = await dirInfoRepository.exists(dir.id);
    const subdirExists = await dirInfoRepository.exists(subdir.id);

    expect(dirExists).toBe(false);
    expect(subdirExists).toBe(true);
  });

  it(`throws DirInfoNotFoundError
      when attempting to delete non-existing dirInfo`, async () => {
    await expect(dirInfoRepository.delete(FAKE_DIR_ID)).rejects.toThrow(
      DirInfoNotFoundError
    );
  });
});
