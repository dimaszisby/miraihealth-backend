import AppError from "@/utils/AppError.js";
import {
  ListMetricSettingsOptions,
  ListMetricSettingsResult,
  MetricSettingsRepository,
} from "../../domain/repositories/MetricSettingsRepository.js";

export class ListMetricSettingsViaCursor {
  constructor(private repo: MetricSettingsRepository) {}

  async execute(
    options: ListMetricSettingsOptions,
  ): Promise<ListMetricSettingsResult> {
    if (!options.userId) throw new AppError("User not authenticated", 401);
    return this.repo.listByCursor(options);
  }
}
