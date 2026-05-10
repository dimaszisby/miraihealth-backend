import { User } from "../persistence/models/user.sequelize.js";
import { UserDomain } from "@/types/domain/user.domain.js";
import { UserResponseDTO } from "../http/dto.js";

export const toDomainUser = (user: User): UserDomain => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isPublicProfile: user.isPublicProfile,
  emailVerifiedAt: user.emailVerifiedAt ?? null,
  createdAt: user.createdAt!,
  updatedAt: user.updatedAt!,
  deletedAt: user.deletedAt,
});

export const toUserResponseDTO = (user: UserDomain): UserResponseDTO => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isPublicProfile: user.isPublicProfile,
  emailVerifiedAt: user.emailVerifiedAt
    ? user.emailVerifiedAt.toISOString()
    : null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
