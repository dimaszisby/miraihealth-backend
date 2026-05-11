import { UserResponseDTO } from "../http/dto.js";

type UserLike = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isPublicProfile: boolean;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toUserResponseDTO = (user: UserLike): UserResponseDTO => ({
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
