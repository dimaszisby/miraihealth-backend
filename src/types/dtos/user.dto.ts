// src/types/user.dto.ts

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  age?: number;
  sex: "male" | "female" | "other" | "prefer not to specify";
  isPublicProfile: boolean;
  role: "user" | "admin";
}
