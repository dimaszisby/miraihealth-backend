import AppError from "@/utils/AppError";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";

export class GetCategory {
  constructor(private repo: MetricCategoryRepository) {}

  async execute(userId: string, categoryId: string) {
    const category = await this.repo.findById(userId, categoryId);
    if (!category) {
      throw new AppError("Metric Category not found", 404);
    }
    return category;
  }
}
