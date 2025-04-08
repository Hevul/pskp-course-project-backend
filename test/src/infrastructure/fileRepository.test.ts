import { promises as fs } from "fs";
import { FILE_REPOSITORY_LS } from "../utils/localStorages";
import { BUFFER, FILE_NAME } from "../utils/constants";
import { FileAlreadyExistsError, FileRepository } from "../utils/imports";
import FileNotFoundError from "../../../infrastructure/src/data/storage/file/errors/FileNotFoundError";

describe("FileRepository", () => {
  let fileRepository: FileRepository;

  beforeAll(async () => {
    fileRepository = new FileRepository(FILE_REPOSITORY_LS);
  });

  beforeEach(async () => {
    await fs.mkdir(FILE_REPOSITORY_LS, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(FILE_REPOSITORY_LS, { recursive: true, force: true });
  });

  it(`upload file
      when directory exists`, async () => {
    await fileRepository.save(`/${FILE_NAME}`, BUFFER);

    const exists = await fileRepository.exists(`/${FILE_NAME}`);

    expect(exists).toBe(true);
  });

  it(`throws FileAlreadyExistsError
      when attempting to save already existing file`, async () => {
    await fileRepository.save(`/${FILE_NAME}`, BUFFER);

    await expect(fileRepository.save(`/${FILE_NAME}`, BUFFER)).rejects.toThrow(
      FileAlreadyExistsError
    );
  });

  it(`returns true
      when file exists`, async () => {
    await fileRepository.save(`/${FILE_NAME}`, BUFFER);

    const exists = await fileRepository.exists(`/${FILE_NAME}`);

    expect(exists).toBe(true);
  });

  it(`returns false
      when file doesn't exist`, async () => {
    const exists = await fileRepository.exists(`/${FILE_NAME}`);

    expect(exists).toBe(false);
  });

  it(`returns file's data
      when file exists`, async () => {
    await fileRepository.save(`/${FILE_NAME}`, BUFFER);

    const data = await fileRepository.get(`/${FILE_NAME}`);

    expect(data).toEqual(BUFFER);
  });

  it(`throws FileNotFoundError
      when attempting to return file's data of non-existing file`, async () => {
    await expect(fileRepository.get(`/${FILE_NAME}`)).rejects.toThrow(
      FileNotFoundError
    );
  });

  it(`deletes file
      when file exists`, async () => {
    const pathname = `/${FILE_NAME}`;
    await fileRepository.save(pathname, BUFFER);

    await fileRepository.rm(pathname);

    const exists = await fileRepository.exists(pathname);
    expect(exists).toBe(false);
  });

  it(`throws FileNotFoundError
      when attempting to delete non-existing file`, async () => {
    await expect(fileRepository.rm(`/${FILE_NAME}`)).rejects.toThrow(
      FileNotFoundError
    );
  });
});
