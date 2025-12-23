import AppError from "@/utils/AppError.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { PasswordHasher } from "../ports/PasswordHasher.js";
import { AuthUser } from "../../domain/entities/AuthUser.js";

export type UpdateProfileInput = {
  userId: string;
  email?: string;
  username?: string;
  password?: string;
  isPublicProfile?: boolean;
};

export class UpdateProfile {
  constructor(
    private repo: UserRepository,
    private hasher: PasswordHasher
  ) {}

  async execute(input: UpdateProfileInput): Promise<AuthUser> {
    const { userId } = input;
    if (!userId) throw new AppError("User not authenticated", 401);

    const user = await this.repo.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if (input.email && input.email.toLowerCase() !== user.email) {
      if (await this.repo.existsByEmail(input.email.toLowerCase()))
        throw new AppError("Email already in use", 401);
      user.changeEmail(input.email);
    }

    if (input.username && input.username !== user.username) {
      if (await this.repo.existsByUsername(input.username))
        throw new AppError("Username already in use", 401);
      user.changeUsername(input.username);
    }

    if (typeof input.isPublicProfile === "boolean") {
      user.togglePublicProfile(input.isPublicProfile);
    }

    if (input.password) {
      const passwordHash = await this.hasher.hash(input.password);
      user.setPasswordHash(passwordHash);
    }

    return this.repo.save(user);
  }
}
