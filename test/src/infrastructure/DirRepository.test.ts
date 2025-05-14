import { promises as fs } from "fs";
import { DIR_REPOSITORY_LS } from "../utils/localStorages";
import { DIR_NAME, SUBDIR_NAME } from "../utils/constants";
import {
  DirectoryAlreadyExistsError,
  DirectoryNotFoundError,
  DirRepository,
  FileRepository,
} from "../utils/imports";
import "../utils/customMatchers";

describe("DirRepository", () => {
  let dirRepository: DirRepository;
  let fileRepository: FileRepository;

  beforeAll(async () => {
    dirRepository = new DirRepository(DIR_REPOSITORY_LS);
    fileRepository = new FileRepository(DIR_REPOSITORY_LS);
  });

  beforeEach(async () => {
    await fs.mkdir(DIR_REPOSITORY_LS, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(DIR_REPOSITORY_LS, { recursive: true, force: true });
  });

  it("creates a directory", async () => {
    // ACT
    await dirRepository.mkdir(`/${DIR_NAME}`);

    // ASSERT
    expect(`/${DIR_NAME}`).toExistInStorage(dirRepository);
  });

  it(`throws DirectoryAlreadyExistsError
      when attempting to create already existing directory`, async () => {
    await dirRepository.mkdir(`/${DIR_NAME}`);

    await expect(dirRepository.mkdir(`/${DIR_NAME}`)).rejects.toThrow(
      DirectoryAlreadyExistsError
    );
  });

  it(`throws DirectoryNotFoundError
      when attempting to create nested directories`, async () => {
    await expect(
      dirRepository.mkdir(`/${DIR_NAME}/${SUBDIR_NAME}`)
    ).rejects.toThrow(DirectoryNotFoundError);
  });

  it(`deletes empty directory`, async () => {
    // ASSIGN
    const path = `/${DIR_NAME}`;

    await dirRepository.mkdir(path);

    // ACT
    await dirRepository.rm(path);

    // ASSERT
    expect(path).not.toExistInStorage(dirRepository);
  });

  it(`deletes directory
      when directory has child`, async () => {
    // ASSIGN
    const dirPath = `/${DIR_NAME}`;
    const subdirPath = `/${DIR_NAME}/${SUBDIR_NAME}`;

    await dirRepository.mkdir(dirPath);
    await dirRepository.mkdir(subdirPath);

    // ACT
    await dirRepository.rm(dirPath);

    // ASSERT
    expect(dirPath).not.toExistInStorage(dirRepository);
    expect(subdirPath).not.toExistInStorage(dirRepository);
  });
});
