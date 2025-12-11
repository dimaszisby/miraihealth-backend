import type {
  ListMetricCategoriesResult,
  ListOpts,
  MetricReadRepository,
} from "../ports/MetricReadRepository";
import AppError from "@/utils/AppError";

export class ListMetrics {
  constructor(private repo: MetricReadRepository) {}

  async execute(options: ListOpts): Promise<ListMetricCategoriesResult> {
    if (!options.userId) throw new AppError("User not authenticated", 403);
    return this.repo.listMetrics(options);
  }
}

export type { ListMetricCategoriesResult, ListOpts };
