import { promises as fs } from "fs";
import { DIR_SERVICE_DB } from "../utils/dbs";
import {
  DirService,
  connect,
  DirInfoRepository,
  DirRepository,
  DirInfoDb,
  UserRepository,
  UserStorageRepository,
  UserDb,
  UserStorageDb,
  UserStorageService,
  FileInfoRepository,
  FileRepository,
  FileInfoDb,
  User,
  FileLinkRepository,
  FileLinkDb,
} from "../utils/imports";
import { DIR_SERVICE_LS } from "../utils/localStorages";
import {
  ANOTHER_DIR_NAME,
  ANOTHER_FILE_NAME,
  DIR_NAME,
  FILE_NAME,
  LOGIN,
  PASSWORD,
  STORAGE_NAME,
  SUBDIR_NAME,
} from "../utils/constants";
import mongoose from "mongoose";
import "../utils/customMatchers";
import { FileService } from "../../../application/src/services/FileService";
import { Readable } from "stream";

describe("DirService", () => {
  let userRepository: UserRepository;
  let userStorageRepository: UserStorageRepository;
  let dirRepository: DirRepository;
  let dirInfoRepository: DirInfoRepository;
  let fileInfoRepository: FileInfoRepository;
  let fileRepository: FileRepository;
  let fileLinkRepository: FileLinkRepository;

  let dirService: DirService;
  let userStorageService: UserStorageService;
  let fileService: FileService;

  const TEST_CONTENT = "test content";

  beforeAll(async () => {
    await connect(DIR_SERVICE_DB);

    dirRepository = new DirRepository(DIR_SERVICE_LS);
    dirInfoRepository = new DirInfoRepository();
    fileInfoRepository = new FileInfoRepository();
    userRepository = new UserRepository();
    userStorageRepository = new UserStorageRepository();
    fileRepository = new FileRepository(DIR_SERVICE_LS);
    fileLinkRepository = new FileLinkRepository();

    userStorageService = new UserStorageService(
      userStorageRepository,
      dirRepository,
      fileInfoRepository,
      dirInfoRepository,
      fileLinkRepository
    );
    dirService = new DirService(
      dirInfoRepository,
      fileInfoRepository,
      fileLinkRepository,
      fileRepository
    );
    fileService = new FileService(
      fileInfoRepository,
      fileRepository,
      fileLinkRepository
    );
  });

  beforeEach(async () => {
    await fs.mkdir(DIR_SERVICE_LS);
  });

  afterEach(async () => {
    await fs.rm(DIR_SERVICE_LS, { recursive: true, force: true });
    await DirInfoDb.deleteMany({});
    await FileInfoDb.deleteMany({});
    await UserDb.deleteMany({});
    await UserStorageDb.deleteMany({});
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

  it(`creates directory in a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    // ACT
    const dir = await dirService.create(DIR_NAME, storage.id);

    // ASSERT
    expect(dir.id).toExistInDatabase(dirInfoRepository);
  });

  it(`creates subdirectory in directory`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);

    // ACT
    const subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);

    // ASSERT
    dir = await dirInfoRepository.get(dir.id);

    expect(subdir.id).toExistInDatabase(dirInfoRepository);
    expect(subdir.parent).toBe(dir.id);
  });

  it(`deletes empty directory from a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirService.create(DIR_NAME, storage.id);

    // ACT
    await dirService.delete(dir.id);

    // ASSERT
    expect(dir.id).not.toExistInDatabase(dirInfoRepository);
  });

  it(`deletes not empty directory with force mode`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirService.create(DIR_NAME, storage.id);
    const subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);

    // ACT
    await dirService.delete(dir.id);

    // ASSERT
    expect(dir.id).not.toExistInDatabase(dirInfoRepository);
    expect(subdir.id).not.toExistInDatabase(dirInfoRepository);
  });

  it(`returns directory size`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);
    const dir = await dirService.create(DIR_NAME, storage.id);

    const file1 = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      dir.id
    );
    const file2 = await fileService.upload(
      ANOTHER_FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      dir.id
    );

    // ACT
    const size = await dirService.getSize(dir.id);

    // ASSERT
    const expectedSize = file1.size + file2.size;

    expect(size).toBe(expectedSize);
  });

  it(`copies subdir with file to a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    let dir = await dirService.create(DIR_NAME, storage.id);
    let subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      subdir.id
    );

    // ACT
    const copiedSubdir = await dirService.copy(subdir.id);

    // ASSERT
    dir = await dirInfoRepository.get(dir.id);
    subdir = await dirInfoRepository.get(subdir.id);

    expect(copiedSubdir.parent).toBe(undefined);
  });

  it(`moves subdir from dir to another dir`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    let dir = await dirService.create(DIR_NAME, storage.id);
    let subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);
    let anotherDir = await dirService.create(ANOTHER_DIR_NAME, storage.id);

    let file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      subdir.id
    );

    // ACT
    await dirService.move({ id: subdir.id, destinationId: anotherDir.id });

    // ASSERT
    anotherDir = await dirInfoRepository.get(anotherDir.id);
    subdir = await dirInfoRepository.get(subdir.id);

    expect(subdir.parent).toBe(anotherDir.id);
  });

  it(`renames dir`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    let dir = await dirService.create(DIR_NAME, storage.id);
    let file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      dir.id
    );

    // ACT
    await dirService.rename(dir.id, ANOTHER_DIR_NAME);

    // ASSERT
    dir = await dirInfoRepository.get(dir.id);

    expect(dir.name).toBe(ANOTHER_DIR_NAME);
  });
});
