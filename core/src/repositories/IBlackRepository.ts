export default interface IBlackRepository {
  add(userId: string): Promise<void>;
  removeByUserId(userId: string): Promise<void>;
  existsByUserId(userId: string): Promise<boolean>;
}
