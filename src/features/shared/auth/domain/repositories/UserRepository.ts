import { AuthUser } from "../entities/AuthUser.js";

export type CreateUserDTO = {
  email: string;
  username: string;
  passwordHash: string;
  isPublicProfile: boolean;
};

export interface UserRepository {
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  findById(id: string): Promise<AuthUser | null>;
  findByIds(ids: string[]): Promise<AuthUser[]>;
  findByEmail(email: string): Promise<AuthUser | null>;
  create(data: CreateUserDTO): Promise<AuthUser>;
  save(user: AuthUser): Promise<AuthUser>;
}
