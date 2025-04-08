import { promises as fs } from "fs";
import {
  ANOTHER_BUFFER,
  ANOTHER_DIR_NAME,
  ANOTHER_FILE_NAME,
  BUFFER,
  DIR_NAME,
  FAKE_FILE_ID,
  FAKE_STORAGE_ID,
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
  FileInfoAlreadyExistsError,
  FileInfoDb,
  FileInfoNotFoundError,
  FileInfoRepository,
  FileRepository,
  FileService,
  User,
  UserDb,
  UserRepository,
  UserStorageDb,
  UserStorageNotFoundError,
  UserStorageRepository,
  UserStorageService,
} from "../utils/imports";
import mongoose from "mongoose";
import "../utils/customMatchers";

describe("FileService", () => {
  let userRepository: UserRepository;
  let fileInfoRepository: FileInfoRepository;
  let dirInfoRepository: DirInfoRepository;
  let userStorageRepository: UserStorageRepository;
  let dirRepository: DirRepository;
  let fileRepository: FileRepository;

  let fileService: FileService;
  let userStorageService: UserStorageService;
  let dirService: DirService;

  beforeAll(async () => {
    await connect(FILE_SERVICE_DB);

    userRepository = new UserRepository();
    fileInfoRepository = new FileInfoRepository();
    dirInfoRepository = new DirInfoRepository();
    dirRepository = new DirRepository(FILE_SERVICE_LS);
    fileRepository = new FileRepository(FILE_SERVICE_LS);
    userStorageRepository = new UserStorageRepository();

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

    dirService = new DirService(dirRepository, dirInfoRepository);
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

    const pathname = `/${storage.id}/${FILE_NAME}`;

    // ACT
    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    // ASSERT
    expect(file.id).toExistInDatabase(fileInfoRepository);
    expect(pathname).toExistInStorage(fileRepository);
  });

  it(`uploads file in a directory
      when directory exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);

    // ACT
    const file = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      dir.id
    );

    // ASSERT
    const filePathname = `/${storage.id}/${dir.name}/${file.name}`;
    dir = await dirInfoRepository.get(dir.id);

    expect(dir).toBeParentTo(file);
    expect(file.id).toExistInDatabase(fileInfoRepository);
    expect(filePathname).toExistInStorage(fileRepository);
  });

  it(`uploads two files in a storage`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    // ACT
    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);
    const anotherFile = await fileService.upload(
      ANOTHER_FILE_NAME,
      ANOTHER_BUFFER,
      storage.id
    );

    // ASSERT
    const filePathname = `/${storage.id}/${file.name}`;
    const anotherFilePathname = `/${storage.id}/${anotherFile.name}`;

    expect(file.id).toExistInDatabase(fileInfoRepository);
    expect(anotherFile.id).toExistInDatabase(fileInfoRepository);
    expect(filePathname).toExistInStorage(fileRepository);
    expect(anotherFilePathname).toExistInStorage(fileRepository);
  });

  it(`returns file data
      when file exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    // ACT
    const downloadedData = await fileService.download(file.id);

    // ASSERT
    expect(BUFFER).toEqual(downloadedData);
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

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    // ACT
    await fileService.delete(file.id);

    // ASSERT
    const filePathname = `/${storage.id}/${file.name}`;

    expect(file.id).not.toExistInDatabase(fileInfoRepository);
    expect(filePathname).not.toExistInStorage(fileRepository);
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

    let dir = await dirService.create(DIR_NAME, storage.id);

    const file = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      dir.id
    );

    //ACT
    await fileService.delete(file.id);

    // ASSERT
    dir = await dirInfoRepository.get(dir.id);
    const filePathname = `/${storage.id}/${dir.name}/${file.name}`;

    expect(file.id).not.toExistInDatabase(fileInfoRepository);
    expect(filePathname).not.toExistInStorage(fileRepository);
    expect(dir).not.toBeParentTo(file);
  });

  it(`overwrite file
      when file exists`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    // ACT
    await fileService.overwrite(file.id, ANOTHER_BUFFER);

    // ASSERT
    const newData = await fileService.download(file.id);
    const overwrittenFile = await fileInfoRepository.get(file.id);

    expect(newData).toEqual(ANOTHER_BUFFER);
    expect(overwrittenFile.size).toBe(ANOTHER_BUFFER.length);
    expect(overwrittenFile.updateAt).toBeDefined();
  });

  it(`copy file in a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirService.create(DIR_NAME, storage.id);

    const file = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      dir.id
    );

    // ACT
    const copiedFile = await fileService.copy(file.id);

    // ASSERT
    const copiedFilePathname = `/${storage.id}/${copiedFile.name}`;

    expect(copiedFile).not.toHaveParent();
    expect(copiedFilePathname).toExistInStorage(fileRepository);
  });

  it(`copy file in another directory`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);
    let anotherDir = await dirService.create(ANOTHER_DIR_NAME, storage.id);

    const file = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      dir.id
    );

    // ACT
    const copiedFile = await fileService.copy(file.id, anotherDir.id);

    // ASSERT
    const copiedFilePathname = `/${storage.id}/${anotherDir.name}/${copiedFile.name}`;
    anotherDir = await dirInfoRepository.get(anotherDir.id);

    expect(anotherDir).toBeParentTo(copiedFile);
    expect(copiedFilePathname).toExistInStorage(fileRepository);
  });

  it(`throws FileInfoAlreadyExistsError
      when attempting to copy file with the same name in the same directory`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirService.create(DIR_NAME, storage.id);

    const file = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      dir.id
    );

    // ACT
    // ASSERT
    await expect(fileService.copy(file.id, file.parent)).rejects.toThrow(
      FileInfoAlreadyExistsError
    );
  });

  it(`move file from dir to a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);

    let file = await fileService.upload(FILE_NAME, BUFFER, storage.id, dir.id);

    // ACT
    await fileService.move(file.id);

    // ASSERT
    dir = await dirInfoRepository.get(dir.id);
    file = await fileInfoRepository.get(file.id);

    const oldFilePathname = `/${storage.id}/${dir.name}/${file.name}`;
    const newFilePathname = `/${storage.id}/${file.name}`;

    expect(dir).not.toBeParentTo(file);
    expect(file).not.toHaveParent();
    expect(oldFilePathname).not.toExistInStorage(fileRepository);
    expect(newFilePathname).toExistInStorage(fileRepository);
  });

  it(`move file from directory to another directory`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);
    let anotherDir = await dirService.create(ANOTHER_DIR_NAME, storage.id);

    let file = await fileService.upload(FILE_NAME, BUFFER, storage.id, dir.id);

    // ACT
    await fileService.move(file.id, anotherDir.id);

    // ASSERT
    anotherDir = await dirInfoRepository.get(anotherDir.id);
    dir = await dirInfoRepository.get(dir.id);
    file = await fileInfoRepository.get(file.id);

    const oldFilePathname = `/${storage.id}/${dir.name}/${file.name}`;
    const newFilePathname = `/${storage.id}/${anotherDir.name}/${file.name}`;

    expect(dir).not.toBeParentTo(file);
    expect(anotherDir).toBeParentTo(file);
    expect(oldFilePathname).not.toExistInStorage(fileRepository);
    expect(newFilePathname).toExistInStorage(fileRepository);
  });

  it(`renames file in a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let file = await fileService.upload(FILE_NAME, BUFFER, storage.id);

    // ACT
    await fileService.rename(file.id, ANOTHER_FILE_NAME);

    // ASSERT
    file = await fileInfoRepository.get(file.id);
    const newFilePathname = `/${storage.id}/${file.name}`;

    expect(file.name).toBe(ANOTHER_FILE_NAME);
    expect(newFilePathname).toExistInStorage(fileRepository);
  });

  it(`renames file in a directory`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);

    let file = await fileService.upload(FILE_NAME, BUFFER, storage.id, dir.id);

    // ACT
    await fileService.rename(file.id, ANOTHER_FILE_NAME);

    // ASSERT
    file = await fileInfoRepository.get(file.id);
    const newFilePathname = `/${storage.id}/${dir.name}/${file.name}`;

    expect(file.name).toBe(ANOTHER_FILE_NAME);
    expect(newFilePathname).toExistInStorage(fileRepository);
  });
});
