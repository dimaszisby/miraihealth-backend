/**
 * * User Domain Model
 * Pure internal representation for business logic (independent of DB & API).
 */

export interface UserDomain {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isPublicProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
