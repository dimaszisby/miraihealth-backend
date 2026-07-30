import AppError from "@/utils/AppError.js";
import { AuthRequest, MembershipInfo } from "@/types/request.context.js";
import { UserDomain } from "@/types/domain/user.domain.js";

export type AuthenticatedRequest = AuthRequest & {
  user: UserDomain;
  organizationId: string;
  membership: MembershipInfo;
};

export function assertAuthenticated(
  req: AuthRequest,
): asserts req is AuthenticatedRequest {
  if (!req.user || !req.organizationId || !req.membership) {
    throw new AppError("User not authenticated", 401);
  }
}
