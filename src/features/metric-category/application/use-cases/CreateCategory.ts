import AppError from "@/utils/AppError.js";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository.js";
import { CachePort } from "../ports/CachePort.js";
import { METRIC_CATEGORY_CURSOR_NAMESPACE_ALL } from "@/features/metric-category/application/cache.constants.js";

type Input = { userId: string; name: string; color?: string; icon?: string };

export class CreateCategory {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort,
  ) {}

  async execute({ userId, name, color, icon }: Input) {
    if (await this.repo.existsByName(userId, name)) {
      throw new AppError("Category already exists", 409);
    }
    const category = await this.repo.create(userId, { name, color, icon });
    if (this.cache.isEnabled()) {
      await this.cache.delByPattern(
        `${METRIC_CATEGORY_CURSOR_NAMESPACE_ALL}:${userId}:*`,
      ); // invalidate lists
    }
    return category;
  }
}
