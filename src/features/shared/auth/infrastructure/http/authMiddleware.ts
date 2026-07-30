import { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";
import { AuthRequest } from "@/types/request.context.js";
import { UserDomain } from "@/types/domain/user.domain.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { UserRepositorySequelize } from "../persistence/UserRepositorySequelize.js";
import { MembershipRepository } from "../../domain/repositories/MembershipRepository.js";
import { MembershipRepositorySequelize } from "../persistence/MembershipRepositorySequelize.js";
import { TokenProvider } from "../../application/ports/TokenProvider.js";
import { JwtTokenProvider } from "../providers/JwtTokenProvider.js";
import { AuthUser } from "../../domain/entities/AuthUser.js";

type Dependencies = {
  userRepo: UserRepository;
  membershipRepo: MembershipRepository;
  tokenProvider: TokenProvider;
};

const defaultDependencies = (): Dependencies => ({
  userRepo: new UserRepositorySequelize(),
  membershipRepo: new MembershipRepositorySequelize(),
  tokenProvider: new JwtTokenProvider(),
});

const toUserDomain = (user: AuthUser, organizationId: string): UserDomain => ({
  id: user.id,
  username: user.username,
  email: user.email,
  isPublicProfile: user.isPublicProfile,
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  deletedAt: user.deletedAt,
  organizationId,
});

export const makeAuthMiddleware = (
  tokenProvider: TokenProvider,
  userRepo: UserRepository,
  membershipRepo: MembershipRepository,
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Unauthorized: No token provided", 401));
    }

    const token = authHeader.split(" ")[1];
    try {
      const claims = await tokenProvider.verify(token);
      const authUser = await userRepo.findById(claims.userId);

      if (!authUser) {
        return next(new AppError("Unauthorized: User not found", 401));
      }

      if (!claims.organizationId) {
        return next(
          new AppError("Unauthorized: Token missing organization context", 401),
        );
      }

      const membership = await membershipRepo.findByUserAndOrg(
        authUser.id,
        claims.organizationId,
      );
      if (!membership || !membership.isActive()) {
        return next(
          new AppError("Unauthorized: Organization membership inactive", 401),
        );
      }

      req.user = toUserDomain(authUser, membership.organizationId);
      req.organizationId = membership.organizationId;
      req.membership = {
        id: membership.id,
        role: membership.role,
        organizationId: membership.organizationId,
        userId: membership.userId,
      };
      next();
    } catch {
      return next(new AppError("Unauthorized: Invalid token", 401));
    }
  };
};

export const createAuthMiddleware = (
  deps: Dependencies = defaultDependencies(),
) => {
  return makeAuthMiddleware(
    deps.tokenProvider,
    deps.userRepo,
    deps.membershipRepo,
  );
};

export const authMiddleware = createAuthMiddleware();
