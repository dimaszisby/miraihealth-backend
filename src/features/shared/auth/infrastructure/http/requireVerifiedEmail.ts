import { Response, NextFunction } from "express";
import { AuthRequest } from "@/types/request.context.js";
import AppError from "@/utils/AppError.js";

export const requireVerifiedEmail = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  if (!req.user.emailVerifiedAt)
    return next(new AppError("Email address is not verified", 403));
  next();
};
