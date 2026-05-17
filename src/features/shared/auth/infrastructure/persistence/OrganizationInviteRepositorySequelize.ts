import { Op } from "sequelize";
import { models } from "@/infrastructure/db/models.js";
import { OrganizationInvite } from "../../domain/entities/OrganizationInvite.js";
import {
  CreateOrganizationInviteDTO,
  OrganizationInviteRepository,
} from "../../domain/repositories/OrganizationInviteRepository.js";
import type { OrganizationInvite as InviteModel } from "./models/organization-invite.sequelize.js";

const toDomain = (row: InviteModel): OrganizationInvite =>
  OrganizationInvite.fromPersistence({
    id: row.id,
    organizationId: row.organizationId,
    email: row.email,
    role: row.role,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    acceptedAt: row.acceptedAt,
    createdAt: row.createdAt ?? new Date(0),
  });

export class OrganizationInviteRepositorySequelize implements OrganizationInviteRepository {
  async save(data: CreateOrganizationInviteDTO): Promise<OrganizationInvite> {
    const created = await models.OrganizationInvite.create({
      organizationId: data.organizationId,
      email: data.email,
      role: data.role,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    });
    await created.reload();
    return toDomain(created);
  }

  async findByTokenHash(hash: string): Promise<OrganizationInvite | null> {
    const row = await models.OrganizationInvite.findOne({
      where: { tokenHash: hash },
    });
    return row ? toDomain(row) : null;
  }

  async findPendingByEmailAndOrg(
    email: string,
    organizationId: string,
  ): Promise<OrganizationInvite | null> {
    const row = await models.OrganizationInvite.findOne({
      where: {
        email,
        organizationId,
        acceptedAt: { [Op.is]: null },
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    return row ? toDomain(row) : null;
  }

  async markAccepted(id: string, now: Date): Promise<void> {
    await models.OrganizationInvite.update(
      { acceptedAt: now },
      { where: { id } },
    );
  }
}
