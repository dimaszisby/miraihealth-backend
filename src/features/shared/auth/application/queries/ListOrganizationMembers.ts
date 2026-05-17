import { MembershipRepository } from "../../domain/repositories/MembershipRepository.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import type {
  MembershipRole,
  MembershipStatus,
} from "../../domain/entities/Membership.js";

export type MemberDTO = {
  membershipId: string;
  userId: string;
  username: string;
  email: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: string;
};

export class ListOrganizationMembers {
  constructor(
    private membershipRepo: MembershipRepository,
    private userRepo: UserRepository,
  ) {}

  async execute(organizationId: string): Promise<MemberDTO[]> {
    const memberships =
      await this.membershipRepo.findAllByOrganization(organizationId);

    const userIds = memberships.map((m) => m.userId);
    const users = await this.userRepo.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    return memberships.reduce<MemberDTO[]>((acc, m) => {
      const user = userMap.get(m.userId);
      if (!user) return acc;
      acc.push({
        membershipId: m.id,
        userId: user.id,
        username: user.username,
        email: user.email,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt.toISOString(),
      });
      return acc;
    }, []);
  }
}
