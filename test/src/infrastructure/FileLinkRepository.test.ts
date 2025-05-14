import mongoose from "mongoose";
import {
  connect,
  FileInfo,
  FileInfoDb,
  FileInfoRepository,
  FileLink,
  FileLinkDb,
  FileLinkNotFoundError,
  FileLinkRepository,
  User,
  UserDb,
  UserRepository,
  UserStorage,
  UserStorageDb,
  UserStorageRepository,
} from "../utils/imports";
import { FILE_LINK_REPOSITORY_DB } from "../utils/dbs";
import {
  ANOTHER_LINK_LINK,
  FAKE_LINK_ID,
  LINK_LINK,
  FILE_NAME,
  FILE_SIZE,
  LINK_NAME,
  LOGIN,
  PASSWORD,
  STORAGE_NAME,
  ANOTHER_LINK_NAME,
  EMPTY_FRIENDS,
  IS_PUBLIC,
  IS_PRIVATE,
  PHYSICAL_FILE_ID,
  FAKE_USER_ID,
} from "../utils/constants";
import "../utils/customMatchers";
import FileLinkAlreadyExistsError from "../../../infrastructure/src/data/db/fileLink/errors/FileLinkAlreadyExists";

describe("FileLinkRepository", () => {
  let userRepository: UserRepository;
  let userStorageRepository: UserStorageRepository;
  let fileInfoRepository: FileInfoRepository;
  let fileLinkRepository: FileLinkRepository;

  const uploadAt = new Date();

  beforeAll(async () => {
    await connect(FILE_LINK_REPOSITORY_DB);

    userRepository = new UserRepository();
    userStorageRepository = new UserStorageRepository();
    fileInfoRepository = new FileInfoRepository();
    fileLinkRepository = new FileLinkRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await UserDb.deleteMany({});
    await UserStorageDb.deleteMany({});
    await FileInfoDb.deleteMany({});
    await FileLinkDb.deleteMany({});
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
    const file = new FileInfo({
      name: FILE_NAME,
      uploadAt,
      size: FILE_SIZE,
      storage: storage.id,
      parent: options?.parentId,
      physicalFileId: PHYSICAL_FILE_ID,
    });

    return await fileInfoRepository.add(file);
  };

  const createFileLink = async (
    user: User,
    file: FileInfo,
    options?: { friends?: string[]; isPublic?: boolean }
  ) => {
    const friends = options?.friends ?? EMPTY_FRIENDS;

    const link = new FileLink({
      link: LINK_LINK,
      name: LINK_NAME,
      ownerId: user.id,
      fileInfoId: file.id,
      friends,
      isPublic: options?.isPublic,
    });

    return await fileLinkRepository.add(link);
  };

  it(`adds link`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await createFileInfo(storage);

    // ACT
    const link = await createFileLink(user, file);

    // ASSERT
    expect(link.link).toBe(LINK_LINK);
    expect(link.name).toBe(LINK_NAME);
    expect(link.ownerId).toBe(user.id);
    expect(link.fileInfoId).toBe(file.id);
    expect(link.id).toExistInDatabase(fileLinkRepository);
    expect(link.friends).toEqual(EMPTY_FRIENDS);
    expect(link.isPublic).toBe(IS_PUBLIC);
  });

  it(`throws FileLinkAlreadyExistsError
      when attempting to add fileLink with the same link`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await createFileInfo(storage);

    const link = await createFileLink(user, file);

    // ACT
    // ASSERT
    await expect(fileLinkRepository.add(link)).rejects.toThrow(
      FileLinkAlreadyExistsError
    );
  });

  it(`returns fileLink by id`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await createFileInfo(storage);

    const link = await createFileLink(user, file);

    // ACT
    const foundLink = await fileLinkRepository.get(link.id);

    // ASSERT
    expect(foundLink).toEqual(link);
  });

  it(`returns fileLink by link`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await createFileInfo(storage);

    const link = await createFileLink(user, file);

    // ACT
    const foundLink = await fileLinkRepository.getByLink(link.link);

    // ASSERT
    expect(foundLink).toEqual(link);
  });

  it(`throws FileLinkNotFoundError
      when attempting to get link by id`, async () => {
    // ACT
    // ASSERT
    await expect(fileLinkRepository.get(FAKE_LINK_ID)).rejects.toThrow(
      FileLinkNotFoundError
    );
  });

  it(`deletes fileLink`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await createFileInfo(storage);

    const link = await createFileLink(user, file);

    // ACT
    await fileLinkRepository.delete(link.id);

    // ASSERT
    expect(link.id).not.toExistInDatabase(fileLinkRepository);
  });

  it(`throws FileLinkNotFoundError
      when attempting to delete non-existing link`, async () => {
    // ACT
    // ASSERT
    await expect(fileLinkRepository.delete(FAKE_LINK_ID)).rejects.toThrow(
      FileLinkNotFoundError
    );
  });

  it(`updates link`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const file = await createFileInfo(storage);
    const link = await createFileLink(user, file);

    // ACT
    link.link = ANOTHER_LINK_LINK;
    link.name = ANOTHER_LINK_NAME;
    link.setPublicity(IS_PRIVATE);

    await fileLinkRepository.update(link);

    // ASSERT
    const updatedLink = await fileLinkRepository.get(link.id);

    expect(updatedLink).toEqual(link);
  });
});
