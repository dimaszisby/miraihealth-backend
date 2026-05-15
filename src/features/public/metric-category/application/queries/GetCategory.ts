import AppError from "@/utils/AppError.js";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository.js";

export class GetCategory {
  constructor(private repo: MetricCategoryRepository) {}

  async execute(userId: string, organizationId: string, categoryId: string) {
    const category = await this.repo.findById(
      userId,
      organizationId,
      categoryId,
    );
    if (!category) {
      throw new AppError("Metric Category not found", 404);
    }
    return category;
  }
}
