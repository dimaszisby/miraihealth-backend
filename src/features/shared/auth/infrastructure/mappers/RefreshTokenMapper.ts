import { RefreshToken as RefreshTokenDomain } from "../../domain/entities/RefreshToken.js";
import type { RefreshToken as RefreshTokenModel } from "../persistence/models/refresh-token.sequelize.js";

export const toDomainRefreshToken = (
  row: RefreshTokenModel,
): RefreshTokenDomain =>
  RefreshTokenDomain.fromPersistence({
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId ?? null,
    familyId: row.familyId,
    tokenHash: row.tokenHash,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt ?? null,
    replacedById: row.replacedById ?? null,
    userAgent: row.userAgent ?? null,
    ip: row.ip ?? null,
  });
