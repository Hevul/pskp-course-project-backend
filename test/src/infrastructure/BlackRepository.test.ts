import mongoose from "mongoose";
import IBlackRepository from "../../../core/src/repositories/IBlackRepository";
import BlackRepository from "../../../infrastructure/src/data/db/black/BlackRepository";
import BlackDb from "../../../infrastructure/src/data/db/black/BlackDb";
import { connect } from "../utils/imports";
import { BLACK_REPOSITORY_DB } from "../utils/dbs";

describe("BlackRepository", () => {
  let repository: IBlackRepository;
  const testUserId = "507f1f77bcf86cd799439011";

  beforeAll(async () => {
    await connect(BLACK_REPOSITORY_DB);
    repository = new BlackRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await BlackDb.deleteMany({});
  });

  describe("add()", () => {
    it("should add user to blacklist", async () => {
      await repository.add(testUserId);

      const exists = await BlackDb.exists({ user: testUserId });
      expect(exists).toBeTruthy();
    });

    it("should not throw when adding duplicate user", async () => {
      await repository.add(testUserId);
      await expect(repository.add(testUserId)).resolves.not.toThrow();
    });
  });

  describe("removeByUserId()", () => {
    it("should remove user from blacklist", async () => {
      await new BlackDb({ user: testUserId }).save();

      await repository.removeByUserId(testUserId);

      const exists = await BlackDb.exists({ user: testUserId });
      expect(exists).toBeFalsy();
    });
  });

  describe("existsByUserId()", () => {
    it("should return true for existing user", async () => {
      await new BlackDb({ user: testUserId }).save();
      const result = await repository.existsByUserId(testUserId);
      expect(result).toBe(true);
    });

    it("should return false for non-existing user", async () => {
      const result = await repository.existsByUserId("nonexistent");
      expect(result).toBe(false);
    });
  });
});
