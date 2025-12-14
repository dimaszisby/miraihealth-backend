import { User } from "@/features/auth/infrastructure/persistence/models/user.sequelize";
import { UserDomain } from "@/types/domain/user.domain";
import { UserResponseDTO } from "../http/dto";

export const toDomainUser = (user: User): UserDomain => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isPublicProfile: user.isPublicProfile,
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
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
