import type {
  ListMetricsResult,
  ListOpts,
  MetricReadRepository,
} from "../ports/MetricReadRepository.js";
import AppError from "@/utils/AppError.js";

export class ListMetrics {
  constructor(private repo: MetricReadRepository) {}

  async execute(options: ListOpts): Promise<ListMetricsResult> {
    if (!options.userId) throw new AppError("User not authenticated", 403);
    return this.repo.listMetrics(options);
  }
}

export type { ListMetricsResult, ListOpts };
