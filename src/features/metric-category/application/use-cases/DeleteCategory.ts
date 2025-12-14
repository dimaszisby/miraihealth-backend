import AppError from "@/utils/AppError";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";
import { CachePort } from "../ports/CachePort";
import { METRIC_CATEGORY_CURSOR_NAMESPACE_ALL } from "@/features/metric-category/application/cache.constants";

export class DeleteCategory {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort
  ) {}

  async execute(userId: string, categoryId: string) {
    const category = await this.repo.findById(userId, categoryId);
    if (!category) {
      throw new AppError("Metric Category not found", 404);
    }

    await this.repo.delete(userId, categoryId);

    if (this.cache.isEnabled()) {
      await this.cache.delByPattern(
        `${METRIC_CATEGORY_CURSOR_NAMESPACE_ALL}:${userId}:*`
      );
      await this.cache.delByPattern(`category:${userId}:${categoryId}`);
    }
  }
}
