import mongoose from "mongoose";
import {
  DIR_NAME,
  FAKE_DIR_ID,
  FAKE_FILE_ID,
  FILE_NAME,
  FILE_SIZE,
  LOGIN,
  PASSWORD,
  STORAGE_NAME,
} from "../utils/constants";
import { FILE_INFO_REPOSITORY_DB } from "../utils/dbs";
import {
  connect,
  DirInfo,
  DirInfoDb,
  DirInfoNotFoundError,
  DirInfoRepository,
  FileInfo,
  FileInfoAlreadyExistsError,
  FileInfoDb,
  FileInfoNotFoundError,
  FileInfoRepository,
  User,
  UserDb,
  UserRepository,
  UserStorage,
  UserStorageDb,
  UserStorageRepository,
} from "../utils/imports";
import "../utils/customMatchers";

describe("FileInfoRepository", () => {
  const uploadAt = new Date();

  let fileInfoRepository: FileInfoRepository;
  let userRepository: UserRepository;
  let userStorageRepository: UserStorageRepository;
  let dirInfoRepository: DirInfoRepository;

  beforeAll(async () => {
    await connect(FILE_INFO_REPOSITORY_DB);

    fileInfoRepository = new FileInfoRepository();
    userRepository = new UserRepository();
    userStorageRepository = new UserStorageRepository();
    dirInfoRepository = new DirInfoRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await FileInfoDb.deleteMany({});
    await UserDb.deleteMany({});
    await UserStorageDb.deleteMany({});
    await DirInfoDb.deleteMany({});
  });

  const createUserAndStorage = async () => {
    const user = await userRepository.add(new User(LOGIN, PASSWORD));
    const storage = await userStorageRepository.add(
      new UserStorage(STORAGE_NAME, user.id)
    );
    return { user, storage };
  };

  const createFileInfo = async (
    storage: UserStorage,
    options?: { parentId: string }
  ) => {
    const file = new FileInfo(
      FILE_NAME,
      uploadAt,
      FILE_SIZE,
      storage.id,
      options?.parentId
    );

    return await fileInfoRepository.add(file);
  };

  it(`returns all fileInfos 
      when user has fileInfo`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    await createFileInfo(storage);

    // ACT
    const fileInfos = await fileInfoRepository.getAll();

    // ASSERT
    expect(fileInfos.length).toBe(1);
  });

  it(`returns empty array of fileInfos 
      when no fileInfo exists`, async () => {
    const fileInfos = await fileInfoRepository.getAll();

    expect(fileInfos.length).toBe(0);
  });

  it(`returns fileInfo
      when fileInfo exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const fileInfo = await createFileInfo(storage);

    // ACT
    const foundFileInfo = await fileInfoRepository.get(fileInfo.id);

    // ASSERT
    expect(foundFileInfo).toBeInstanceOf(FileInfo);
    expect(foundFileInfo.name).toBe(FILE_NAME);
    expect(foundFileInfo.uploadAt).toEqual(uploadAt);
    expect(foundFileInfo.size).toBe(FILE_SIZE);
    expect(foundFileInfo.storage).toBe(storage.id);
  });

  it(`throws FileInfoNotFoundError 
      when attempting to get non-existing fileInfo`, async () => {
    await expect(fileInfoRepository.get(FAKE_FILE_ID)).rejects.toThrow(
      FileInfoNotFoundError
    );
  });

  it(`adds fileInfo without parent`, async () => {
    const { user, storage } = await createUserAndStorage();

    const fileInfo = await createFileInfo(storage);

    expect(fileInfo.id).toExistInDatabase(fileInfoRepository);
  });

  it(`adds fileInfo with parent`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = new DirInfo(DIR_NAME, uploadAt, storage.id);
    dir = await dirInfoRepository.add(dir);

    // ACT
    const file = await createFileInfo(storage, { parentId: dir.id });

    // ASSERT
    const foundFile = await fileInfoRepository.get(file.id);

    expect(foundFile.parent).toBe(dir.id);
  });

  it(`throws FileInfoAlreadyExistsError 
      when attempting to add already existing fileInfo`, async () => {
    const { user, storage } = await createUserAndStorage();

    const file = await createFileInfo(storage);

    await expect(fileInfoRepository.add(file)).rejects.toThrow(
      FileInfoAlreadyExistsError
    );
  });

  it(`deletes fileInfo 
      when fileInfo exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const fileInfo = await createFileInfo(storage);

    // ACT
    await fileInfoRepository.delete(fileInfo.id);

    // ASSERT
    await expect(fileInfoRepository.get(fileInfo.id)).rejects.toThrow(
      FileInfoNotFoundError
    );
  });

  it(`throws FileInfoNotFoundError 
      when attempting to delete non-existing fileInfo`, async () => {
    await expect(fileInfoRepository.delete(FAKE_FILE_ID)).rejects.toThrow(
      FileInfoNotFoundError
    );
  });

  it(`updates fileInfo 
      when fileInfo exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await createFileInfo(storage);

    file.size = 1;
    file.updateAt = new Date();

    // ACT
    const updatedFileInfo = await fileInfoRepository.update(file);

    // ASSERT
    expect(file.id).toBe(updatedFileInfo.id);
    expect(file.name).toBe(updatedFileInfo.name);
    expect(file.uploadAt).toEqual(updatedFileInfo.uploadAt);
    expect(file.storage).toBe(updatedFileInfo.storage);
    expect(file.size).toBe(updatedFileInfo.size);
    expect(file.updateAt).toEqual(updatedFileInfo.updateAt);
  });

  it(`returns absolute file path without parent`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await createFileInfo(storage);

    // ACT
    const path = await fileInfoRepository.getPathname(file.id);

    // ASSERT
    expect(path).toBe(`/${storage.id}/${file.name}`);
  });

  it(`returns absolute file path with parent`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = new DirInfo(DIR_NAME, uploadAt, storage.id);
    dir = await dirInfoRepository.add(dir);

    const file = await createFileInfo(storage, { parentId: dir.id });

    // ACT
    const path = await fileInfoRepository.getPathname(file.id);

    // ASSERT
    expect(path).toBe(`/${storage.id}/${dir.name}/${file.name}`);
  });
});
