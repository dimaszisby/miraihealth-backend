import AppError from "@/utils/AppError";
import {
  ListMetricSettingsOptions,
  ListMetricSettingsResult,
  MetricSettingsRepository,
} from "../../domain/repositories/MetricSettingsRepository";

export class ListMetricSettingsViaCursor {
  constructor(private repo: MetricSettingsRepository) {}

  async execute(
    options: ListMetricSettingsOptions
  ): Promise<ListMetricSettingsResult> {
    if (!options.userId) throw new AppError("User not authenticated", 401);
    return this.repo.listByCursor(options);
  }
}
