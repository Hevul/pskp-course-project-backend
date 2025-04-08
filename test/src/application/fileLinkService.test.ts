import { promises as fs } from "fs";
import {
  ANOTHER_LOGIN,
  ANOTHER_PASSWORD,
  BUFFER,
  EMPTY_FRIENDS,
  FILE_NAME,
  IS_PRIVATE,
  IS_PUBLIC,
  LINK_NAME,
  LOGIN,
  PASSWORD,
  STORAGE_NAME,
} from "../utils/constants";
import { FILE_LINK_SERVICE_LS } from "../utils/localStorages";
import { FILE_LINK_SERVICE_DB } from "../utils/dbs";
import {
  connect,
  DirInfoRepository,
  DirRepository,
  FileInfoDb,
  FileInfoRepository,
  FileLinkDb,
  FileLinkRepository,
  FileLinkService,
  FileRepository,
  FileService,
  HashSha256Provider,
  LinkAccessDeniedError,
  User,
  UserDb,
  UserNotFileOwnerError,
  UserRepository,
  UserStorageDb,
  UserStorageRepository,
  UserStorageService,
} from "../utils/imports";
import mongoose from "mongoose";
import "../utils/customMatchers";

describe("FileLinkService", () => {
  const anotherUser = new User(ANOTHER_LOGIN, ANOTHER_PASSWORD);

  let userRepository: UserRepository;
  let fileInfoRepository: FileInfoRepository;
  let fileLinkRepository: FileLinkRepository;
  let dirInfoRepository: DirInfoRepository;
  let userStorageRepository: UserStorageRepository;
  let dirRepository: DirRepository;
  let fileRepository: FileRepository;

  let hashProvider: HashSha256Provider;

  let fileService: FileService;
  let userStorageService: UserStorageService;
  let fileLinkService: FileLinkService;

  beforeAll(async () => {
    await connect(FILE_LINK_SERVICE_DB);

    userRepository = new UserRepository();
    fileInfoRepository = new FileInfoRepository();
    fileLinkRepository = new FileLinkRepository();
    dirInfoRepository = new DirInfoRepository();
    dirRepository = new DirRepository(FILE_LINK_SERVICE_LS);
    fileRepository = new FileRepository(FILE_LINK_SERVICE_LS);
    userStorageRepository = new UserStorageRepository();

    hashProvider = new HashSha256Provider();

    fileService = new FileService(
      fileInfoRepository,
      fileRepository,
      dirInfoRepository
    );

    userStorageService = new UserStorageService(
      userStorageRepository,
      dirRepository,
      fileInfoRepository,
      dirInfoRepository
    );

    fileLinkService = new FileLinkService(
      fileLinkRepository,
      fileInfoRepository,
      fileRepository,
      userRepository,
      hashProvider
    );
  });

  beforeEach(async () => {
    await fs.mkdir(FILE_LINK_SERVICE_LS);
  });

  afterEach(async () => {
    await fs.rm(FILE_LINK_SERVICE_LS, { recursive: true, force: true });
    await UserDb.deleteMany({});
    await UserStorageDb.deleteMany({});
    await FileInfoDb.deleteMany({});
    await FileLinkDb.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const createUserAndStorage = async () => {
    const user = await userRepository.add(new User(LOGIN, PASSWORD));
    const storage = await userStorageService.create(STORAGE_NAME, user.id);
    return { user, storage };
  };

  it(`generates link`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    // ACT
    const fileLink = await fileLinkService.generate(
      LINK_NAME,
      user.id,
      file.id,
      EMPTY_FRIENDS,
      IS_PUBLIC
    );

    // ASSERT
    const expectedLink = hashProvider.generate(`${LINK_NAME}.${user.id}`);

    expect(fileLink.link).toBe(expectedLink);
  });

  it(`returns file data by public link
      when user is attempting to download file`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();
    const user = await userRepository.add(anotherUser);

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    const link = await fileLinkService.generate(
      LINK_NAME,
      owner.id,
      file.id,
      EMPTY_FRIENDS,
      IS_PUBLIC
    );

    // ACT
    const data = await fileLinkService.download(link.link, user.id);

    // ASSERT
    expect(data).toEqual(BUFFER);
  });

  it(`returns file data by private link
      when owner is attempting to download file`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    const link = await fileLinkService.generate(
      LINK_NAME,
      owner.id,
      file.id,
      EMPTY_FRIENDS,
      IS_PRIVATE
    );

    // ACT
    // ASSERT
    await expect(
      fileLinkService.download(link.link, owner.id)
    ).resolves.not.toThrow();
  });

  it(`returns file data by private link
      when friend is attempting to download file`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();
    const friend = await userRepository.add(anotherUser);

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    const link = await fileLinkService.generate(
      LINK_NAME,
      owner.id,
      file.id,
      [friend.id],
      IS_PRIVATE
    );

    // ACT
    // ASSERT
    await expect(
      fileLinkService.download(link.link, friend.id)
    ).resolves.not.toThrow();
  });

  it(`throws LinkAccessDeniedError
      when user is attempting to download file by private link`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();
    const user = await userRepository.add(anotherUser);

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    const link = await fileLinkService.generate(
      LINK_NAME,
      owner.id,
      file.id,
      EMPTY_FRIENDS,
      IS_PRIVATE
    );

    // ACT
    // ASSERT
    await expect(fileLinkService.download(link.link, user.id)).rejects.toThrow(
      LinkAccessDeniedError
    );
  });

  it(`adds friend`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();
    const user = await userRepository.add(anotherUser);

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    let link = await fileLinkService.generate(
      LINK_NAME,
      owner.id,
      file.id,
      EMPTY_FRIENDS,
      IS_PRIVATE
    );

    // ACT
    link = await fileLinkService.addFriend(link.id, user.id);

    // ASSERT
    expect(link.friends).toContain(user.id);
  });

  it(`removes friend`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();
    const user = await userRepository.add(anotherUser);

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    let link = await fileLinkService.generate(
      LINK_NAME,
      owner.id,
      file.id,
      [user.id],
      IS_PRIVATE
    );

    // ACT
    link = await fileLinkService.removeFriend(link.id, user.id);

    // ASSERT
    expect(link.friends).not.toContain(user.id);
  });
});
