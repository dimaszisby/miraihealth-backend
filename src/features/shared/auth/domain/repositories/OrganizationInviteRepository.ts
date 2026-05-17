import {
  OrganizationInvite,
  InviteRole,
} from "../entities/OrganizationInvite.js";

export type CreateOrganizationInviteDTO = {
  organizationId: string;
  email: string;
  role: InviteRole;
  tokenHash: string;
  expiresAt: Date;
};

export interface OrganizationInviteRepository {
  save(data: CreateOrganizationInviteDTO): Promise<OrganizationInvite>;
  findByTokenHash(hash: string): Promise<OrganizationInvite | null>;
  findPendingByEmailAndOrg(
    email: string,
    organizationId: string,
  ): Promise<OrganizationInvite | null>;
  markAccepted(id: string, now: Date): Promise<void>;
}
