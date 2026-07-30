import { EmailVerificationToken as EmailVerificationTokenDomain } from "../../domain/entities/EmailVerificationToken.js";
import type { EmailVerificationToken as EmailVerificationTokenModel } from "../persistence/models/email-verification-token.sequelize.js";

export const toDomainEmailVerificationToken = (
  row: EmailVerificationTokenModel,
): EmailVerificationTokenDomain =>
  EmailVerificationTokenDomain.fromPersistence({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt ?? null,
    createdAt: row.createdAt ?? new Date(0),
  });
