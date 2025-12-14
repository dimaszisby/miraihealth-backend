import { env } from "@/config/zodEnv";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AppError from "@/utils/AppError";
import { AuthRequest } from "@/types/request.context";
import { UserDomain } from "@/types/domain/user.domain";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { UserRepositorySequelize } from "../persistence/UserRepositorySequelize";
import { AuthUser } from "../../domain/entities/AuthUser";

type Dependencies = {
  userRepo: UserRepository;
};

const defaultDependencies = (): Dependencies => ({
  userRepo: new UserRepositorySequelize(),
});

const toUserDomain = (user: AuthUser): UserDomain => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isPublicProfile: user.isPublicProfile,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  deletedAt: user.deletedAt,
});

export const createAuthMiddleware = (deps: Dependencies = defaultDependencies()) => {
  const { userRepo } = deps;
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Unauthorized: No token provided", 401));
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET as string) as { id: string };
      const authUser = await userRepo.findById(decoded.id);

      if (!authUser) {
        return next(new AppError("Unauthorized: User not found", 401));
      }

      req.user = toUserDomain(authUser);
      next();
    } catch (error) {
      return next(new AppError("Unauthorized: Invalid token", 401));
    }
  };
};

export const authMiddleware = createAuthMiddleware();
