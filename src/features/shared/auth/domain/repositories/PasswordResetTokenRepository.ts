import { PasswordResetToken } from "../entities/PasswordResetToken.js";

export type CreatePasswordResetTokenDTO = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface PasswordResetTokenRepository {
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  create(data: CreatePasswordResetTokenDTO): Promise<PasswordResetToken>;
  markUsed(id: string, usedAt: Date): Promise<void>;
  invalidateAllForUser(userId: string, now?: Date): Promise<void>;
}
