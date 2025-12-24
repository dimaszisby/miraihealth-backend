import AppError from "@/utils/AppError.js";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository.js";
import { CachePort } from "../ports/CachePort.js";
import { METRIC_CATEGORY_CURSOR_NAMESPACE_ALL } from "@/features/metric-category/application/cache.constants.js";

type Input = {
  userId: string;
  categoryId: string;
  name?: string;
  color?: string;
  icon?: string;
};

export class UpdateCategory {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort,
  ) {}

  async execute({ userId, categoryId, name, color, icon }: Input) {
    const current = await this.repo.findById(userId, categoryId);
    if (!current) {
      throw new AppError("Metric Category not found", 404);
    }

    if (name && name !== current.name) {
      const exists = await this.repo.existsByName(userId, name);
      if (exists) {
        throw new AppError("Metric Category name already exists", 400);
      }
    }

    const updated = await this.repo.update(userId, categoryId, {
      name,
      color,
      icon,
    });

    if (this.cache.isEnabled()) {
      await this.cache.delByPattern(
        `${METRIC_CATEGORY_CURSOR_NAMESPACE_ALL}:${userId}:*`,
      );
      await this.cache.delByPattern(`category:${userId}:${categoryId}`);
    }

    return updated;
  }
}
