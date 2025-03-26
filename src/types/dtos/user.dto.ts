// src/types/user.dto.ts

/**
 * * Data Transfer Objects (DTO)
 * For incoming/outgoing API contract.
 */

// Response when returning user (e.g., on login, profile)
export interface UserResponseDTO {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isPublicProfile: boolean;
  createdAt: string;
  updatedAt: string;
}
