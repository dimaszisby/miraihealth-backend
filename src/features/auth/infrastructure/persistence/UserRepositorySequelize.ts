import { models } from "@/infrastructure/db/models.js";
import { AuthUser } from "../../domain/entities/AuthUser.js";
import {
  CreateUserDTO,
  UserRepository,
} from "../../domain/repositories/UserRepository.js";
import type { User } from "./models/user.sequelize.js";

const toDomain = (row: User): AuthUser =>
  AuthUser.fromPersistence({
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password,
    role: row.role ?? "user",
    isPublicProfile: row.isPublicProfile ?? !!row.isPublicProfile,
    createdAt: row.createdAt ?? new Date(0),
    updatedAt: row.updatedAt ?? new Date(0),
    deletedAt: row.deletedAt ?? null,
  });

export class UserRepositorySequelize implements UserRepository {
  async existsByEmail(email: string): Promise<boolean> {
    const count = await models.User.count({ where: { email } });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await models.User.count({ where: { username } });
    return count > 0;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const user = await models.User.findByPk(id);
    return user ? toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await models.User.findOne({ where: { email } });
    return user ? toDomain(user) : null;
  }

  async create(data: CreateUserDTO): Promise<AuthUser> {
    const created = await models.User.create({
      email: data.email,
      username: data.username,
      password: data.passwordHash,
      isPublicProfile: true,
      role: "user",
    });
    await created.reload();
    return toDomain(created);
  }

  async save(user: AuthUser): Promise<AuthUser> {
    const row = await models.User.findByPk(user.id);
    if (!row) throw new Error("User not found");
    await row.update({
      email: user.email,
      username: user.username,
      password: user.passwordHash,
      isPublicProfile: user.isPublicProfile,
    });
    await row.reload();
    return toDomain(row);
  }
}
