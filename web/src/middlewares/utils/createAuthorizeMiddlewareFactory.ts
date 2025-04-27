import { RequestHandler } from "express";
import {
  EntityType,
  IAuthorizationService,
} from "../../../../application/src/interfaces/IAuthorizationService";

export const createAuthorizeMiddlewareFactory = (
  authService: IAuthorizationService
) => {
  return function createAuthorizeMiddleware(options: {
    entityTypes?: {
      [field: string]: EntityType;
    };
    defaultEntityType?: EntityType;
    idLocations?: ("params" | "body" | "query")[];
    idFields?: string[];
  }): RequestHandler {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }

        const entitiesToCheck: { id: string; type: EntityType }[] = [];

        options.idLocations?.forEach((location) => {
          options.idFields?.forEach((field) => {
            let value = req[location]?.[field];
            const entityType =
              options.entityTypes?.[field] ?? options.defaultEntityType;

            if (!entityType) {
              throw new Error(`Entity type not specified for field ${field}`);
            }

            if (value) {
              if (location === "query" && typeof value === "string") {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  throw new Error(
                    `Invalid JSON format for query parameter ${field}`
                  );
                }
              }

              if (Array.isArray(value)) {
                entitiesToCheck.push(
                  ...value.map((id) => ({ id, type: entityType }))
                );
              } else {
                entitiesToCheck.push({ id: value, type: entityType });
              }
            }
          });
        });

        if (entitiesToCheck.length === 0) {
          res.status(400).json({ message: "Entity IDs not provided" });
          return;
        }

        const groupedEntities: Record<EntityType, string[]> = {} as any;
        entitiesToCheck.forEach(({ id, type }) => {
          if (!groupedEntities[type]) {
            groupedEntities[type] = [];
          }
          groupedEntities[type].push(id);
        });

        for (const [type, ids] of Object.entries(groupedEntities)) {
          await authService.authorizeRequest(
            req.user.id,
            ids,
            type as EntityType
          );
        }

        next();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Access denied";
        res.status(403).json({ message });
      }
    };
  };
};
