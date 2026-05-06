import AppError from "@/utils/AppError.js";
import logger from "@/utils/logger.js";
import {
  RefreshTokenRepository,
  TransactionPort,
} from "../../domain/repositories/RefreshTokenRepository.js";
import { TokenProvider, TokenPayload } from "../ports/TokenProvider.js";
import { TokenHasher } from "../ports/TokenHasher.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { IssueRefreshToken } from "./IssueRefreshToken.js";

export type RotateRefreshTokenInput = {
  rawToken: string;
  userAgent?: string | null;
  ip?: string | null;
};

export type RotateRefreshTokenResult = {
  accessToken: string;
  rawRefreshToken: string;
};

export class RotateRefreshToken {
  constructor(
    private refreshTokenRepo: RefreshTokenRepository,
    private userRepo: UserRepository,
    private tokenProvider: TokenProvider,
    private tokenHasher: TokenHasher,
    private issueRefreshToken: IssueRefreshToken,
    private tx: TransactionPort,
  ) {}

  async execute(
    input: RotateRefreshTokenInput,
  ): Promise<RotateRefreshTokenResult> {
    const tokenHash = this.tokenHasher.hash(input.rawToken);

    return this.tx.runInTransaction(async (transaction) => {
      const existing = await this.refreshTokenRepo.findByTokenHashForUpdate(
        tokenHash,
        transaction,
      );

      if (!existing) {
        throw new AppError("Unauthorized: Invalid refresh token", 401);
      }

      if (existing.isRevoked()) {
        logger.warn("auth.refresh.reuse_detected", {
          userId: existing.userId,
          familyId: existing.familyId,
          ip: input.ip,
          userAgent: input.userAgent,
        });
        await this.refreshTokenRepo.revokeFamily(
          existing.familyId,
          undefined,
          transaction,
        );
        throw new AppError("Unauthorized: Invalid refresh token", 401);
      }

      if (existing.isExpired()) {
        await this.refreshTokenRepo.revokeFamily(
          existing.familyId,
          undefined,
          transaction,
        );
        throw new AppError("Unauthorized: Invalid refresh token", 401);
      }

      const user = await this.userRepo.findById(existing.userId);
      if (!user) {
        throw new AppError("Unauthorized: User not found", 401);
      }

      existing.markRevoked();
      const { rawToken: newRawToken, refreshToken: newRefreshToken } =
        await this.issueRefreshToken.executeInTransaction(
          {
            userId: existing.userId,
            familyId: existing.familyId,
            userAgent: input.userAgent,
            ip: input.ip,
          },
          transaction,
        );

      existing.replaceWith(newRefreshToken.id);
      await this.refreshTokenRepo.save(existing, transaction);

      const accessToken = this.tokenProvider.sign({
        id: user.id,
        email: user.email,
        username: user.username,
      } as TokenPayload);

      logger.info("auth.refresh.success", {
        userId: existing.userId,
        familyId: existing.familyId,
      });

      return { accessToken, rawRefreshToken: newRawToken };
    });
  }
}
