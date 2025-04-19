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
            const value = req[location]?.[field];
            const entityType =
              options.entityTypes?.[field] ?? options.defaultEntityType;

            if (!entityType) {
              throw new Error(`Entity type not specified for field ${field}`);
            }

            if (value) {
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

        for (const { id, type } of entitiesToCheck) {
          await authService.authorizeRequest(req.user.id, [id], type);
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
