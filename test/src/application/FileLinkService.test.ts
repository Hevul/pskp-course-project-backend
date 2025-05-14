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
  FileRepository,
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
import { FileService } from "../../../application/src/services/FileService";
import { FileLinkService } from "../../../application/src/services/FileLinkService";
import { Readable } from "stream";

describe.only("FileLinkService", () => {
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

  const TEST_CONTENT = "test content";
  const anotherUser = new User(ANOTHER_LOGIN, ANOTHER_PASSWORD);

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
      fileLinkRepository
    );

    userStorageService = new UserStorageService(
      userStorageRepository,
      dirRepository,
      fileInfoRepository,
      dirInfoRepository,
      fileLinkRepository
    );

    fileLinkService = new FileLinkService(
      userStorageRepository,
      fileLinkRepository,
      fileInfoRepository,
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
    const readable = Readable.from(TEST_CONTENT);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );

    // ACT
    const fileLink = await fileLinkService.generate(user.id, file.id);

    // ASSERT
    expect(fileLink.fileInfoId).toBe(file.id);
  });

  it(`returns file data by public link
      when user is attempting to download file`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();
    const user = await userRepository.add(anotherUser);
    const readable = Readable.from(TEST_CONTENT);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );

    const link = await fileLinkService.generate(user.id, file.id);

    // ACT
    const data = await fileLinkService.download(link.link, user.id);

    // ASSERT
    const [fileInfo, path] = data;

    expect(fileInfo).toEqual(file);
    expect(file.path()).toEqual(path);
  });

  it(`returns file data by private link
      when owner is attempting to download file`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );

    const link = await fileLinkService.generate(user.id, file.id);
    link.setPublicity(false);

    await fileLinkRepository.update(link);

    // ACT
    // ASSERT
    await expect(
      fileLinkService.download(link.link, user.id)
    ).resolves.not.toThrow();
  });

  it(`adds friend`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();
    const user = await userRepository.add(anotherUser);
    const readable = Readable.from(TEST_CONTENT);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );

    let link = await fileLinkService.generate(owner.id, file.id);

    // ACT
    link = await fileLinkService.addFriend(link.id, user.login);

    // ASSERT
    expect(link.friends).toContain(user.id);
  });

  it(`removes friend`, async () => {
    // ASSIGN
    const { user: owner, storage } = await createUserAndStorage();
    const user = await userRepository.add(anotherUser);
    const readable = Readable.from(TEST_CONTENT);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );

    let link = await fileLinkService.generate(owner.id, file.id);

    // ACT
    link = await fileLinkService.removeFriend(link.id, user.id);

    // ASSERT
    expect(link.friends).not.toContain(user.id);
  });
});
