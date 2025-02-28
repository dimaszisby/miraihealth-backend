// src/types/user.types.ts

export interface UserBase {
  username: string;
  email: string;
  password: string;
  age?: number;
  sex: "male" | "female" | "other" | "prefer not to specify";
  isPublicProfile: boolean;
  role: "user" | "admin";
}
