import IBlackRepository from "../../../../../core/src/repositories/IBlackRepository";
import BlackDb from "./BlackDb";

class BlackRepository implements IBlackRepository {
  async add(userId: string): Promise<void> {
    try {
      const blackEntry = new BlackDb({ user: userId });
      await blackEntry.save();
    } catch {
      return;
    }
  }

  async removeByUserId(userId: string): Promise<void> {
    await BlackDb.deleteOne({ user: userId });
  }

  async existsByUserId(userId: string): Promise<boolean> {
    try {
      const entry = await BlackDb.findOne({ user: userId });
      return !!entry;
    } catch {
      return false;
    }
  }
}

export default BlackRepository;
