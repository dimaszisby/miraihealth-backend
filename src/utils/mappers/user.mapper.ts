// src/utils/mappers/user.mapper.ts

import { User } from "@/models/user.model";
import { UserDomain } from "@/types/domain/user.domain";
import { UserResponseDTO } from "@/types/dtos/user.dto";

/**
 * * Mapper: Sequelize → Domain
 */
export const toDomainUser = (user: User): UserDomain => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isPublicProfile: user.isPublicProfile,
  createdAt: user.createdAt!,
  updatedAt: user.updatedAt!,
  deletedAt: user.deletedAt ?? null,
});

/**
 * * Mapper: Domain → DTO (for responses)
 */
export const toUserResponseDTO = (user: UserDomain): UserResponseDTO => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isPublicProfile: user.isPublicProfile,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
