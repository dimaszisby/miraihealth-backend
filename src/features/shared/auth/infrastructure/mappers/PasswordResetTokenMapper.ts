import { PasswordResetToken as PasswordResetTokenDomain } from "../../domain/entities/PasswordResetToken.js";
import type { PasswordResetToken as PasswordResetTokenModel } from "../persistence/models/password-reset-token.sequelize.js";

export const toDomainPasswordResetToken = (
  row: PasswordResetTokenModel,
): PasswordResetTokenDomain =>
  PasswordResetTokenDomain.fromPersistence({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt ?? null,
    createdAt: row.createdAt ?? new Date(0),
  });
