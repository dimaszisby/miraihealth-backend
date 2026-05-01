import { Response, NextFunction } from "express";
import { AuthRequest } from "@/types/request.context.js";
import AppError from "@/utils/AppError.js";

export const requireAdmin = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  if (req.user.role !== "admin")
    return next(new AppError("Forbidden: admin access required", 403));
  next();
};
