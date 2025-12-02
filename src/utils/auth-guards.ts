import AppError from "@/utils/AppError";
import { AuthRequest } from "@/types/request.context";
import { UserDomain } from "@/types/domain/user.domain";

export type AuthenticatedRequest = AuthRequest & { user: UserDomain };

export function assertAuthenticated(
  req: AuthRequest
): asserts req is AuthenticatedRequest {
  if (!req.user) throw new AppError("User not authenticated", 401);
}
