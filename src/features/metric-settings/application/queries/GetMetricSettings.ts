import AppError from "@/utils/AppError";
import { MetricSettings } from "../../domain/entities/MetricSettings";
import { MetricSettingsRepository } from "../../domain/repositories/MetricSettingsRepository";

export class GetMetricSettings {
  constructor(private repo: MetricSettingsRepository) {}

  async execute(userId: string, settingsId: string): Promise<MetricSettings> {
    if (!userId) throw new AppError("User not authenticated", 401);

    const found = await this.repo.findById(userId, settingsId);
    if (!found) throw new AppError("Metric Settings not found", 404);

    return found;
  }
}
