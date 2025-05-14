import { promises as fs } from "fs";
import IUserRepository from "../../../core/src/repositories/IUserRepository";
import {
  DirInfo,
  FileInfo,
  IDirInfoRepository,
  IFileInfoRepository,
  IFileLinkRepository,
  IUserStorageRepository,
  StorageRepository,
} from "./imports";
import { Response } from "express";

declare global {
  namespace jest {
    interface Matchers<R = unknown> {
      toExistInFileSystem(): R;
      toExistInStorage(repo: StorageRepository): Promise<R>;
      toExistInDatabase(
        repo:
          | IDirInfoRepository
          | IFileInfoRepository
          | IUserStorageRepository
          | IFileLinkRepository
          | IUserRepository
      ): Promise<R>;
      toHaveParent(): R;
      toBeParentTo(child: DirInfo | FileInfo): R;
      toHaveCode(code: number): R;
      toBeOk(): R;
      toBeError(expectedClass: any): R;
    }
  }
}

expect.extend({
  async toExistInFileSystem(this: jest.MatcherContext, received: string) {
    try {
      await fs.access(received);
      return {
        pass: true,
        message: () =>
          `Expected file at path "${received}" not to exist, but it does`,
      };
    } catch {
      return {
        pass: false,
        message: () =>
          `Expected file at path "${received}" to exist, but it doesn't`,
      };
    }
  },
  async toExistInStorage(path: string, storage: StorageRepository) {
    const exists = await storage.exists(path);
    const pass = exists;

    return {
      pass,
      message: () =>
        `expected ${path} ${pass ? "not " : ""}to exist in storage`,
    };
  },

  async toExistInDatabase(
    id: string,
    repo:
      | IDirInfoRepository
      | IFileInfoRepository
      | IUserStorageRepository
      | IFileLinkRepository
      | IUserRepository
  ) {
    const exists = await repo.exists(id);
    const pass = exists;

    return {
      pass,
      message: () =>
        `expected entity ${id} ${pass ? "not " : ""}to exist in database`,
    };
  },

  toHaveParent(entity: FileInfo | DirInfo) {
    const pass = entity.parent !== undefined;

    return {
      pass,
      message: () => `expected child ${pass ? "not " : ""}to have parent`,
    };
  },

  toHaveCode(response: Response, code: number) {
    const pass = response.statusCode === code;

    const message = pass
      ? () => `expected status code not to be a ${code}`
      : () =>
          `expected status code to be a ${code}, but received ${response.status}`;

    return {
      pass,
      message,
    };
  },

  toBeOk(response: any) {
    const pass = response.body.ok === true;

    return {
      pass,
      message: () => `expected ok ${pass ? "not " : ""}to be true`,
    };
  },

  toBeError(received: any, expectedClass: any) {
    const hasMessage = received.message === expectedClass.message;

    const pass = hasMessage;

    const message = pass
      ? () => `expected error not to match ${expectedClass.name}`
      : () =>
          `expected error to match ${
            expectedClass.name
          }, but received: ${JSON.stringify(received)}`;

    return {
      pass,
      message,
    };
  },
});
