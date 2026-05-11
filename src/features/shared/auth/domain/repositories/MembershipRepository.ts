import {
  Membership,
  MembershipRole,
  MembershipStatus,
} from "../entities/Membership.js";

export type CreateMembershipDTO = {
  userId: string;
  organizationId: string;
  role: MembershipRole;
  status?: MembershipStatus;
};

export interface MembershipRepository {
  findById(id: string): Promise<Membership | null>;
  findByUserAndOrg(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null>;
  findDefaultByUser(userId: string): Promise<Membership | null>;
  findAllByUser(userId: string): Promise<Membership[]>;
  findAllByOrganization(organizationId: string): Promise<Membership[]>;
  create(data: CreateMembershipDTO): Promise<Membership>;
  save(membership: Membership): Promise<Membership>;
  delete(id: string): Promise<void>;
}
