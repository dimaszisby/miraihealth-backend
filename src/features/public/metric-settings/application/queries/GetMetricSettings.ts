import AppError from "@/utils/AppError.js";
import { MetricSettings } from "../../domain/entities/MetricSettings.js";
import { MetricSettingsRepository } from "../../domain/repositories/MetricSettingsRepository.js";

export class GetMetricSettings {
  constructor(private repo: MetricSettingsRepository) {}

  async execute(
    userId: string,
    organizationId: string,
    settingsId: string,
  ): Promise<MetricSettings> {
    if (!userId) throw new AppError("User not authenticated", 401);

    const found = await this.repo.findById(userId, organizationId, settingsId);
    if (!found) throw new AppError("Metric Settings not found", 404);

    return found;
  }
}
