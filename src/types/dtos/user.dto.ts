// src/types/user.dto.ts

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  isPublicProfile: boolean;
  role: "user" | "admin";
}
