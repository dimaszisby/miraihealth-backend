// src/middleware/role-middleware.ts

import { Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../types/request.context.js";

/**
 * * Role-Based Access Middleware
 * Ensures that only users with the required role(s) can access a route.
 *
 * @param roles - Allowed roles (e.g., ["admin"])
 */
export const roleMiddleware = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden: You do not have permission", 403));
    }
    next();
  };
};
