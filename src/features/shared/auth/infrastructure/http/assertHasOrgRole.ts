import { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";
import { AuthRequest, MembershipInfo } from "@/types/request.context.js";

type OrgRole = MembershipInfo["role"];

export function assertHasOrgRole(req: AuthRequest, ...roles: OrgRole[]): void {
  if (!req.membership) {
    throw new AppError("Unauthorized", 401);
  }
  if (!roles.includes(req.membership.role)) {
    throw new AppError("Forbidden: insufficient organization role", 403);
  }
}

export const requireOrgRole =
  (...roles: OrgRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      assertHasOrgRole(req, ...roles);
      next();
    } catch (err) {
      next(err);
    }
  };
