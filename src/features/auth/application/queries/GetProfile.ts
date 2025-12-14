import AppError from "@/utils/AppError";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { AuthUser } from "../../domain/entities/AuthUser";

export class GetProfile {
  constructor(private repo: UserRepository) {}

  async execute(userId: string): Promise<AuthUser> {
    if (!userId) throw new AppError("User not authenticated", 401);
    const user = await this.repo.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return user;
  }
}
