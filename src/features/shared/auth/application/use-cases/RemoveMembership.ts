import AppError from "@/utils/AppError.js";
import { MembershipRepository } from "../../domain/repositories/MembershipRepository.js";

export type RemoveMembershipInput = {
  membershipId: string;
  organizationId: string;
  actorRole: string;
  actorUserId: string;
};

export class RemoveMembership {
  constructor(private membershipRepo: MembershipRepository) {}

  async execute(input: RemoveMembershipInput): Promise<void> {
    if (input.actorRole !== "owner") {
      throw new AppError("Forbidden: only owner can remove members", 403);
    }

    const membership = await this.membershipRepo.findById(input.membershipId);
    if (!membership) {
      throw new AppError("Membership not found", 404);
    }

    if (membership.organizationId !== input.organizationId) {
      throw new AppError("Membership not found", 404);
    }

    if (membership.userId === input.actorUserId) {
      throw new AppError("Cannot remove yourself from the organization", 400);
    }

    if (membership.isOwner()) {
      const ownerCount = await this.membershipRepo.countByOrgAndRole(
        input.organizationId,
        "owner",
      );
      if (ownerCount <= 1) {
        throw new AppError(
          "Cannot remove the last owner of the organization",
          400,
        );
      }
    }

    await this.membershipRepo.delete(membership.id);
  }
}
