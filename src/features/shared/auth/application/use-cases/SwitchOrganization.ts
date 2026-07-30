import AppError from "@/utils/AppError.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { MembershipRepository } from "../../domain/repositories/MembershipRepository.js";
import { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository.js";
import { TokenProvider } from "../ports/TokenProvider.js";
import { IssueRefreshToken } from "./IssueRefreshToken.js";

export type SwitchOrganizationInput = {
  userId: string;
  organizationId: string;
  userAgent?: string | null;
  ip?: string | null;
};

export type SwitchOrganizationResult = {
  accessToken: string;
  rawRefreshToken: string;
};

export class SwitchOrganization {
  constructor(
    private membershipRepo: MembershipRepository,
    private userRepo: UserRepository,
    private refreshTokenRepo: RefreshTokenRepository,
    private tokenProvider: TokenProvider,
    private issueRefreshToken: IssueRefreshToken,
  ) {}

  async execute(
    input: SwitchOrganizationInput,
  ): Promise<SwitchOrganizationResult> {
    const membership = await this.membershipRepo.findByUserAndOrg(
      input.userId,
      input.organizationId,
    );
    if (!membership || !membership.isActive()) {
      throw new AppError(
        "Forbidden: No active membership in this organization",
        403,
      );
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new AppError("Unauthorized: User not found", 401);

    const activeTokens = await this.refreshTokenRepo.findActiveByUser(
      input.userId,
    );
    const familyIds = [...new Set(activeTokens.map((t) => t.familyId))];
    await Promise.all(
      familyIds.map((id) => this.refreshTokenRepo.revokeFamily(id)),
    );

    const accessToken = this.tokenProvider.sign({
      id: user.id,
      email: user.email,
      username: user.username,
      organizationId: input.organizationId,
    });

    const { rawToken } = await this.issueRefreshToken.execute({
      userId: user.id,
      organizationId: input.organizationId,
      userAgent: input.userAgent,
      ip: input.ip,
    });

    return { accessToken, rawRefreshToken: rawToken };
  }
}
