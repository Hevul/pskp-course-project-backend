export type EntityType = "file" | "dir" | "storage" | "link";

export interface IAuthorizationService {
  authorizeRequest(
    userId: string,
    entityIds: string[],
    entityType: EntityType
  ): Promise<void>;
}
