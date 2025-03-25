// src/types/user.types.ts

export interface UserBase {
  username: string;
  email: string;
  password: string;
  isPublicProfile: boolean;
  role: "user" | "admin";
}
