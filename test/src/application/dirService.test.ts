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
  FileService,
  FileRepository,
  FileInfoDb,
  DirectoryNotEmptyError,
  DirectoryMoveError,
  User,
  UserStorage,
} from "../utils/imports";
import { DIR_SERVICE_LS } from "../utils/localStorages";
import {
  ANOTHER_BUFFER,
  ANOTHER_DIR_NAME,
  ANOTHER_FILE_NAME,
  BUFFER,
  DIR_NAME,
  FILE_NAME,
  LOGIN,
  PASSWORD,
  STORAGE_NAME,
  SUB_SUBDIR_NAME,
  SUBDIR_NAME,
} from "../utils/constants";
import mongoose from "mongoose";
import "../utils/customMatchers";

describe("DirService", () => {
  let userRepository: UserRepository;
  let userStorageRepository: UserStorageRepository;
  let dirRepository: DirRepository;
  let dirInfoRepository: DirInfoRepository;
  let fileInfoRepository: FileInfoRepository;
  let fileRepository: FileRepository;

  let dirService: DirService;
  let userStorageService: UserStorageService;
  let fileService: FileService;

  beforeAll(async () => {
    await connect(DIR_SERVICE_DB);

    dirRepository = new DirRepository(DIR_SERVICE_LS);
    dirInfoRepository = new DirInfoRepository();
    fileInfoRepository = new FileInfoRepository();
    userRepository = new UserRepository();
    userStorageRepository = new UserStorageRepository();
    fileRepository = new FileRepository(DIR_SERVICE_LS);

    userStorageService = new UserStorageService(
      userStorageRepository,
      dirRepository,
      fileInfoRepository,
      dirInfoRepository
    );
    dirService = new DirService(dirRepository, dirInfoRepository);
    fileService = new FileService(
      fileInfoRepository,
      fileRepository,
      dirInfoRepository
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
    expect(`/${storage.id}/${dir.name}`).toExistInStorage(dirRepository);
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
    expect(dir.subdirectories).toContain(subdir.id);

    expect(`/${storage.id}/${dir.name}/${subdir.name}`).toExistInStorage(
      dirRepository
    );
  });

  it(`deletes empty directory from a storage root`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirService.create(DIR_NAME, storage.id);

    // ACT
    await dirService.delete(dir.id);

    // ASSERT
    expect(dir.id).not.toExistInDatabase(dirInfoRepository);
    expect(`/${storage.id}/${dir.name}`).not.toExistInStorage(dirRepository);
  });

  it(`throws DirectoryNotEmptyError
      when attempting to delete not empty directory with force mode`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirService.create(DIR_NAME, storage.id);
    const subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);

    // ACT
    // ASSERT
    await expect(dirService.delete(dir.id)).rejects.toThrow(
      DirectoryNotEmptyError
    );
  });

  it(`deletes not empty directory with force mode`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirService.create(DIR_NAME, storage.id);
    const subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);

    // ACT
    await dirService.delete(dir.id, true);

    // ASSERT
    expect(dir.id).not.toExistInDatabase(dirInfoRepository);
    expect(subdir.id).not.toExistInDatabase(dirInfoRepository);
    expect(`/${storage.id}/${dir.name}`).not.toExistInStorage(dirRepository);
  });

  it(`returns directory size`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    const dir = await dirService.create(DIR_NAME, storage.id);

    const file1 = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      dir.id
    );
    const file2 = await fileService.upload(
      ANOTHER_FILE_NAME,
      ANOTHER_BUFFER,
      storage.id,
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

    let dir = await dirService.create(DIR_NAME, storage.id);
    let subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);

    let file = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      subdir.id
    );

    // ACT
    const copiedSubdir = await dirService.copy(subdir.id);

    // ASSERT
    dir = await dirInfoRepository.get(dir.id);
    subdir = await dirInfoRepository.get(subdir.id);

    expect(copiedSubdir.id).not.toBe(subdir.id);
    expect(copiedSubdir).not.toHaveParent();
    expect(`/${storage.id}/${subdir.name}`).toExistInStorage(dirRepository);
    expect(`/${storage.id}/${subdir.name}/${file.name}`).toExistInStorage(
      fileRepository
    );
  });

  it(`copies subdir with file to another dir`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);
    let subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);
    let anotherDir = await dirService.create(ANOTHER_DIR_NAME, storage.id);

    let file = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      subdir.id
    );

    // ACT
    const copiedDir = await dirService.copy(subdir.id, anotherDir.id);

    // ASSERT
    anotherDir = await dirInfoRepository.get(anotherDir.id);
    const copiedSubdirPath = `/${storage.id}/${anotherDir.name}/${subdir.name}`;

    expect(anotherDir).toBeParentTo(copiedDir);
    expect(copiedSubdirPath).toExistInStorage(dirRepository);
  });

  // ! В ПИЗДУ
  it.skip(`moves subdir from dir to another dir`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);
    let subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);
    let anotherDir = await dirService.create(ANOTHER_DIR_NAME, storage.id);

    let file = await fileService.upload(
      FILE_NAME,
      BUFFER,
      storage.id,
      subdir.id
    );

    // ACT
    const movedDir = await dirService.move(subdir.id, anotherDir.id);

    // ASSERT
    const newSubdirPath = `/${storage.id}/${anotherDir.name}/${subdir.name}`;

    anotherDir = await dirInfoRepository.get(anotherDir.id);
    subdir = await dirInfoRepository.get(subdir.id);

    expect(subdir.id).toBe(movedDir.id);
    expect(anotherDir).toBeParentTo(subdir);
    expect(newSubdirPath).toExistInStorage(dirRepository);
  });

  it(`throws DirectoryMoveError
      when attempting to move parent in its child`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);
    let subdir = await dirService.create(SUBDIR_NAME, storage.id, dir.id);
    let subSubdir = await dirService.create(
      SUB_SUBDIR_NAME,
      storage.id,
      subdir.id
    );

    // ACT
    // ASSERT
    await expect(dirService.move(dir.id, subSubdir.id)).rejects.toThrow(
      DirectoryMoveError
    );
  });

  it(`renames dir`, async () => {
    // ASSIGN
    const { user, storage } = await createUserAndStorage();

    let dir = await dirService.create(DIR_NAME, storage.id);

    let file = await fileService.upload(FILE_NAME, BUFFER, storage.id, dir.id);

    // ACT
    await dirService.rename(dir.id, ANOTHER_DIR_NAME);

    // ASSERT
    dir = await dirInfoRepository.get(dir.id);
    const dirPath = `/${storage.id}/${ANOTHER_DIR_NAME}`;

    expect(dir.name).toBe(ANOTHER_DIR_NAME);
    expect(dirPath).toExistInStorage(dirRepository);
  });
});
