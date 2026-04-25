import { Op } from "sequelize";
import { models } from "@/infrastructure/db/models.js";
import { PasswordResetToken } from "../../domain/entities/PasswordResetToken.js";
import {
  CreatePasswordResetTokenDTO,
  PasswordResetTokenRepository,
} from "../../domain/repositories/PasswordResetTokenRepository.js";
import { toDomainPasswordResetToken } from "../mappers/PasswordResetTokenMapper.js";

export class PasswordResetTokenRepositorySequelize implements PasswordResetTokenRepository {
  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await models.PasswordResetToken.findOne({
      where: { tokenHash },
    });
    return row ? toDomainPasswordResetToken(row) : null;
  }

  async create(data: CreatePasswordResetTokenDTO): Promise<PasswordResetToken> {
    const created = await models.PasswordResetToken.create({
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      usedAt: null,
    });
    await created.reload();
    return toDomainPasswordResetToken(created);
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    await models.PasswordResetToken.update({ usedAt }, { where: { id } });
  }

  async invalidateAllForUser(
    userId: string,
    now: Date = new Date(),
  ): Promise<void> {
    await models.PasswordResetToken.update(
      { usedAt: now },
      {
        where: {
          userId,
          usedAt: { [Op.is]: null },
        },
      },
    );
  }
}
