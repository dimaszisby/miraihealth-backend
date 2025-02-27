// src/types/user.types.ts

export interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}
