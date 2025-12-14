import AppError from "@/utils/AppError";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";
import { CachePort } from "../ports/CachePort";

type Input = { userId: string; name: string; color?: string; icon?: string };

export class CreateCategory {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort
  ) {}

  async execute({ userId, name, color, icon }: Input) {
    if (await this.repo.existsByName(userId, name)) {
      throw new AppError("Category already exists", 400);
    }
    const category = await this.repo.create(userId, { name, color, icon });
    if (this.cache.isEnabled()) {
      await this.cache.delByPattern(`categories:${userId}:*`); // invalidate lists
    }
    return category;
  }
}
