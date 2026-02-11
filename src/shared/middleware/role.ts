import { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";
import { AuthRequest } from "@/types/request.context.js";

export const createRoleMiddleware =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden: You do not have permission", 403));
    }
    next();
  };

export const roleMiddleware = (...roles: string[]) =>
  createRoleMiddleware(...roles);
