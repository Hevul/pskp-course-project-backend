import {
  connect,
  DirInfo,
  DirInfoDb,
  DirInfoRepository,
  FileInfo,
  FileInfoDb,
  FileInfoRepository,
  User,
  UserDb,
  UserRepository,
  UserStorage,
  UserStorageDb,
  UserStorageRepository,
} from "../utils/imports";
import PermissionService from "../../../application/src/services/PermissionService";
import { PERMISSION_SERVICE_DB } from "../utils/dbs";
import { before } from "node:test";
import {
  DIR_NAME,
  FAKE_DIR_ID,
  FAKE_FILE_ID,
  FAKE_STORAGE_ID,
  FILE_NAME,
  FILE_SIZE,
  LOGIN,
  PASSWORD,
  STORAGE_ID,
  STORAGE_NAME,
} from "../utils/constants";

describe("PermissionService", () => {
  let userStorageRepository: UserStorageRepository;
  let userRepository: UserRepository;
  let fileInfoRepository: FileInfoRepository;
  let dirInfoRepository: DirInfoRepository;

  let permissionService: PermissionService;

  beforeAll(async () => {
    connect(PERMISSION_SERVICE_DB);

    userStorageRepository = new UserStorageRepository();
    userRepository = new UserRepository();
    fileInfoRepository = new FileInfoRepository();
    dirInfoRepository = new DirInfoRepository();

    permissionService = new PermissionService(
      userStorageRepository,
      userRepository,
      fileInfoRepository,
      dirInfoRepository
    );
  });

  afterEach(async () => {
    await UserStorageDb.deleteMany({});
    await UserDb.deleteMany({});
    await FileInfoDb.deleteMany({});
    await DirInfoDb.deleteMany({});
  });

  const createUserAndStorage = async () => {
    const user = await userRepository.add(new User(LOGIN, PASSWORD));
    const storage = await userStorageRepository.add(
      new UserStorage(STORAGE_NAME, user.id)
    );
    return { user, storage };
  };

  describe("access to storage", () => {
    it(`returns true
        when user has a storage`, async () => {
      // ASSIGN
      const { user, storage } = await createUserAndStorage();

      // ACT
      const haveAccess = await permissionService.accessToStorage(
        storage.id,
        user.id
      );

      // ASSERT
      expect(haveAccess).toBe(true);
    });

    it(`returns false
        when user hasn't a storage`, async () => {
      // ASSIGN
      const user = await userRepository.add(new User(LOGIN, PASSWORD));

      // ACT
      const haveAccess = await permissionService.accessToStorage(
        STORAGE_ID,
        user.id
      );

      // ASSERT
      expect(haveAccess).toBe(false);
    });
  });

  describe("access to file", () => {
    const uploadAt = new Date();

    it(`returns true
        when user is file owner`, async () => {
      // ASSIGN
      const { user, storage } = await createUserAndStorage();
      const file = await fileInfoRepository.add(
        new FileInfo(FILE_NAME, uploadAt, FILE_SIZE, storage.id)
      );

      // ACT
      const haveAccess = await permissionService.accessToFile(file.id, user.id);

      // ASSERT
      expect(haveAccess).toBe(true);
    });

    it(`returns true
        when user isn't file owner`, async () => {
      // ASSIGN
      const { user, storage } = await createUserAndStorage();

      // ACT
      const haveAccess = await permissionService.accessToFile(
        FAKE_FILE_ID,
        user.id
      );

      // ASSERT
      expect(haveAccess).toBe(false);
    });
  });

  describe("access to directory", () => {
    const uploadAt = new Date();

    it(`returns true 
        when user is dir owner`, async () => {
      // ASSIGN
      const { user, storage } = await createUserAndStorage();
      const dir = await dirInfoRepository.add(
        new DirInfo(DIR_NAME, uploadAt, storage.id)
      );

      // ACT
      const haveAccess = await permissionService.accessToDirectory(
        dir.id,
        user.id
      );

      // ASSERT
      expect(haveAccess).toBe(true);
    });

    it(`returns false 
        when user isn't dir owner`, async () => {
      // ASSIGN
      const { user, storage } = await createUserAndStorage();

      // ACT
      const haveAccess = await permissionService.accessToDirectory(
        FAKE_DIR_ID,
        user.id
      );

      // ASSERT
      expect(haveAccess).toBe(false);
    });
  });
});
