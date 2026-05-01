import AppError from "@/utils/AppError.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { AuthUser } from "../../domain/entities/AuthUser.js";

export class GetProfile {
  constructor(private repo: UserRepository) {}

  async execute(userId: string): Promise<AuthUser> {
    if (!userId) throw new AppError("User not authenticated", 401);
    const user = await this.repo.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return user;
  }
}
