import { promises as fs } from "fs";
import { FILE_REPOSITORY_LS } from "../utils/localStorages";
import { BUFFER, FILE_NAME } from "../utils/constants";
import { FileAlreadyExistsError, FileRepository } from "../utils/imports";
import FileNotFoundError from "../../../infrastructure/src/data/storage/file/errors/FileNotFoundError";
import { Readable } from "stream";
import { join } from "path";

describe("FileRepository", () => {
  const TEST_FILE = "/testfile.txt";
  const TEST_CONTENT = "test content";

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

  describe("saveStream()", () => {
    it("should save file from readable stream", async () => {
      const readable = Readable.from(TEST_CONTENT);
      await fileRepository.saveStream(TEST_FILE, readable);

      const content = await fs.readFile(
        join(FILE_REPOSITORY_LS, TEST_FILE),
        "utf-8"
      );
      expect(content).toBe(TEST_CONTENT);
    });

    it("should throw FileAlreadyExistsError when file exists", async () => {
      const readable1 = Readable.from(TEST_CONTENT);
      await fileRepository.saveStream(TEST_FILE, readable1);

      const readable2 = Readable.from("new content");
      await expect(
        fileRepository.saveStream(TEST_FILE, readable2)
      ).rejects.toThrow(FileAlreadyExistsError);
    });
  });

  describe("getStream()", () => {
    it("should return readable stream for existing file", async () => {
      await fs.writeFile(join(FILE_REPOSITORY_LS, TEST_FILE), TEST_CONTENT);

      const stream = await fileRepository.getStream(TEST_FILE);
      expect(stream).toBeInstanceOf(Readable);

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const result = Buffer.concat(chunks).toString();
      expect(result).toBe(TEST_CONTENT);
    });

    it("should throw FileNotFoundError when file does not exist", async () => {
      await expect(fileRepository.getStream(TEST_FILE)).rejects.toThrow(
        FileNotFoundError
      );
    });
  });

  describe("overwrite()", () => {
    it("should overwrite existing file with new content", async () => {
      await fs.writeFile(join(FILE_REPOSITORY_LS, TEST_FILE), "old content");

      const readable = Readable.from("new content");
      await fileRepository.overwrite(TEST_FILE, readable);

      const content = await fs.readFile(
        join(FILE_REPOSITORY_LS, TEST_FILE),
        "utf-8"
      );
      expect(content).toBe("new content");
    });
  });

  describe("rm()", () => {
    it("should delete existing file", async () => {
      await fs.writeFile(join(FILE_REPOSITORY_LS, TEST_FILE), TEST_CONTENT);

      await fileRepository.rm(TEST_FILE);

      const exists = await fs
        .access(join(FILE_REPOSITORY_LS, TEST_FILE))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });

    it("should throw FileNotFoundError when file does not exist", async () => {
      await expect(fileRepository.rm(TEST_FILE)).rejects.toThrow(
        FileNotFoundError
      );
    });
  });
});
