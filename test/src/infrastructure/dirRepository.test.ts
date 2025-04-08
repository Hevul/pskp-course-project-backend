import { promises as fs } from "fs";
import { DIR_REPOSITORY_LS } from "../utils/localStorages";
import {
  ANOTHER_DIR_NAME,
  BUFFER,
  DIR_NAME,
  FILE_NAME,
  SUBDIR_NAME,
} from "../utils/constants";
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

  it(`copies directory with file in another directory`, async () => {
    // ASSIGN
    const dirPath = `/${DIR_NAME}`;
    const anotherDirPath = `/${ANOTHER_DIR_NAME}`;

    await dirRepository.mkdir(dirPath);
    await dirRepository.mkdir(anotherDirPath);

    await fileRepository.save(`${dirPath}/${FILE_NAME}`, BUFFER);

    // ACT
    await dirRepository.copy(dirPath, `${anotherDirPath}${dirPath}`);

    // ASSERT
    const isDirInAnotherDir = await dirRepository.exists(
      `${anotherDirPath}${dirPath}`
    );
    const isFileInDir = await dirRepository.exists(
      `${anotherDirPath}${dirPath}/${FILE_NAME}`
    );

    expect(isDirInAnotherDir).toBe(true);
    expect(isFileInDir).toBe(true);
  });

  it(`copies directory with subdirectory in another directory
      when subdirectory has file`, async () => {
    // ASSIGN
    await dirRepository.mkdir(`/${DIR_NAME}`);
    await dirRepository.mkdir(`/${DIR_NAME}/${SUBDIR_NAME}`);
    await dirRepository.mkdir(`/${ANOTHER_DIR_NAME}`);

    await fileRepository.save(
      `/${DIR_NAME}/${SUBDIR_NAME}/${FILE_NAME}`,
      BUFFER
    );

    // ACT
    await dirRepository.copy(
      `/${DIR_NAME}`,
      `/${ANOTHER_DIR_NAME}/${DIR_NAME}`
    );

    // ASSERT
    const copiedDirPath = `/${ANOTHER_DIR_NAME}/${DIR_NAME}`;
    const copiedFilePath = `/${ANOTHER_DIR_NAME}/${DIR_NAME}/${SUBDIR_NAME}/${FILE_NAME}`;

    expect(copiedDirPath).toExistInStorage(dirRepository);
    expect(copiedFilePath).toExistInStorage(fileRepository);
  });

  it(`throws DirectoryNotFoundError
      when attempting to copy directory in non-existing directory`, async () => {
    // ASSIGN
    const dirPath = `/${DIR_NAME}`;

    await dirRepository.mkdir(dirPath);

    await fileRepository.save(`${dirPath}/${FILE_NAME}`, BUFFER);

    // ACT
    // ASSERT
    await expect(
      dirRepository.copy(dirPath, `/${ANOTHER_DIR_NAME}${dirPath}`)
    ).rejects.toThrow(DirectoryNotFoundError);
  });

  it(`renames directory`, async () => {
    // ASSIGN
    const oldName = `/${DIR_NAME}`;
    const newName = `/${ANOTHER_DIR_NAME}`;

    await dirRepository.mkdir(oldName);

    await fileRepository.save(`/${DIR_NAME}/${FILE_NAME}`, BUFFER);

    // ACT
    await dirRepository.rename(oldName, newName);

    // ASSERT
    expect(oldName).not.toExistInStorage(dirRepository);
    expect(newName).toExistInStorage(dirRepository);
  });
});
