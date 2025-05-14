import { promises as fs } from "fs";
import {
  ANOTHER_DIR_NAME,
  ANOTHER_FILE_NAME,
  DIR_NAME,
  FAKE_FILE_ID,
  FILE_NAME,
  LOGIN,
  PASSWORD,
  STORAGE_NAME,
} from "../utils/constants";
import { FILE_SERVICE_LS } from "../utils/localStorages";
import { FILE_SERVICE_DB } from "../utils/dbs";
import {
  connect,
  DirInfoDb,
  DirInfoRepository,
  DirRepository,
  DirService,
  FileInfoDb,
  FileInfoNotFoundError,
  FileInfoRepository,
  FileLinkRepository,
  FileRepository,
  IFileLinkRepository,
  User,
  UserDb,
  UserRepository,
  UserStorageDb,
  UserStorageRepository,
  UserStorageService,
} from "../utils/imports";
import mongoose from "mongoose";
import "../utils/customMatchers";
import { FileService } from "../../../application/src/services/FileService";
import { Readable } from "stream";
import path from "path";

describe("FileService", () => {
  let userRepository: UserRepository;
  let fileInfoRepository: FileInfoRepository;
  let dirInfoRepository: DirInfoRepository;
  let userStorageRepository: UserStorageRepository;
  let dirRepository: DirRepository;
  let fileRepository: FileRepository;
  let fileLinkRepository: IFileLinkRepository;

  let fileService: FileService;
  let userStorageService: UserStorageService;
  let dirService: DirService;

  const TEST_CONTENT = "test content";

  beforeAll(async () => {
    await connect(FILE_SERVICE_DB);

    userRepository = new UserRepository();
    fileInfoRepository = new FileInfoRepository();
    dirInfoRepository = new DirInfoRepository();
    dirRepository = new DirRepository(FILE_SERVICE_LS);
    fileRepository = new FileRepository(FILE_SERVICE_LS);
    userStorageRepository = new UserStorageRepository();
    fileLinkRepository = new FileLinkRepository();

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

    dirService = new DirService(
      dirInfoRepository,
      fileInfoRepository,
      fileLinkRepository,
      fileRepository
    );
  });

  beforeEach(async () => {
    await fs.mkdir(FILE_SERVICE_LS);
  });

  afterEach(async () => {
    await fs.rm(FILE_SERVICE_LS, { recursive: true, force: true });
    await UserDb.deleteMany({});
    await UserStorageDb.deleteMany({});
    await FileInfoDb.deleteMany({});
    await DirInfoDb.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const createUserAndStorage = async () => {
    const user = await userRepository.add(new User(LOGIN, PASSWORD));
    const storage = await userStorageService.create(STORAGE_NAME, user.id);
    return { user, storage };
  };

  it(`uploads file in a storage`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    // ACT
    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );

    // ASSERT
    const filepath = path.join(FILE_SERVICE_LS, file.path());
    expect(filepath).toExistInFileSystem();
  });

  it(`uploads file in a directory
      when directory exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    let dir = await dirService.create(DIR_NAME, storage.id);
    const readable = Readable.from(TEST_CONTENT);

    // ACT
    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      dir.id
    );

    // ASSERT
    const filepath = path.join(FILE_SERVICE_LS, file.path());

    expect(filepath).toExistInFileSystem();
    expect(file.parent).toBe(dir.id);
  });

  it(`uploads two files in a storage`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    // ACT
    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );
    const anotherFile = await fileService.upload(
      ANOTHER_FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );

    // ASSERT
    const filepath = path.join(FILE_SERVICE_LS, file.path());
    const anotherFilepath = path.join(FILE_SERVICE_LS, anotherFile.path());

    expect(filepath).toExistInFileSystem();
    expect(anotherFilepath).toExistInFileSystem();
  });

  it(`returns file data
      when file exists`, async () => {
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
    const downloadedData = await fileService.download(file.id);

    // ASSERT
    expect(file).toEqual(downloadedData[0]);
  });

  it(`throws FileInfoNotFoundError
      when attempting to return data of non-existing file`, async () => {
    await expect(fileService.download(FAKE_FILE_ID)).rejects.toThrow(
      FileInfoNotFoundError
    );
  });

  it(`deletes file from a storage root
      when file exists`, async () => {
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
    await fileService.delete(file.id);

    // ASSERT
    const filepath = path.join(FILE_SERVICE_LS, file.path());

    expect(file.id).not.toExistInDatabase(fileInfoRepository);
    expect(filepath).not.toExistInFileSystem();
  });

  it(`throws FileInfoNotFoundError
      when attempting to delete non-existing file`, async () => {
    await expect(fileService.delete(FAKE_FILE_ID)).rejects.toThrow(
      FileInfoNotFoundError
    );
  });

  it(`deletes file from directory
      when directory and file exist`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);
    let dir = await dirService.create(DIR_NAME, storage.id);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      dir.id
    );

    //ACT
    await fileService.delete(file.id);

    // ASSERT
    const filepath = path.join(FILE_SERVICE_LS, file.path());

    expect(file.id).not.toExistInDatabase(fileInfoRepository);
    expect(filepath).not.toExistInFileSystem();
  });

  it(`overwrite file
      when file exists`, async () => {
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
    await fileService.overwrite(file.id, readable, TEST_CONTENT.length);

    // ASSERT
    const overwrittenFile = await fileInfoRepository.get(file.id);

    expect(overwrittenFile.updateAt).toBeTruthy();
  });

  it(`copy file in a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);
    const dir = await dirService.create(DIR_NAME, storage.id);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      dir.id
    );

    // ACT
    const copiedFile = await fileService.copy(file.id);

    // ASSERT
    expect(copiedFile).not.toHaveParent();
  });

  it(`copy file in another directory`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    let dir = await dirService.create(DIR_NAME, storage.id);
    let anotherDir = await dirService.create(ANOTHER_DIR_NAME, storage.id);

    const file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      dir.id
    );

    // ACT
    const copiedFile = await fileService.copy(file.id, anotherDir.id);

    // ASSERT
    expect(copiedFile.physicalFileId).toBe(file.physicalFileId);
    expect(copiedFile.parent).toBe(anotherDir.id);
    expect(file.parent).toBe(dir.id);
  });

  it(`move file from dir to a storage root`, async () => {
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
    await fileService.move({ id: file.id });

    // ASSERT
    file = await fileInfoRepository.get(file.id);

    expect(file.parent).toBe(undefined);
  });

  it(`move file from directory to another directory`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    let dir = await dirService.create(DIR_NAME, storage.id);
    let anotherDir = await dirService.create(ANOTHER_DIR_NAME, storage.id);

    let file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length,
      dir.id
    );

    // ACT
    file = await fileService.move({
      id: file.id,
      destinationId: anotherDir.id,
    });

    // ASSERT
    file = await fileInfoRepository.get(file.id);

    expect(file.parent).toBe(anotherDir.id);
  });

  it(`renames file in a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();
    const readable = Readable.from(TEST_CONTENT);

    let file = await fileService.upload(
      FILE_NAME,
      readable,
      storage.id,
      TEST_CONTENT.length
    );

    // ACT
    await fileService.rename(file.id, ANOTHER_FILE_NAME);

    // ASSERT
    file = await fileInfoRepository.get(file.id);

    expect(file.name).toBe(ANOTHER_FILE_NAME);
  });
});
