import AppError from "@/utils/AppError.js";
import { MetricSettingsRepository } from "../../domain/repositories/MetricSettingsRepository.js";
import { CacheInvalidationPort } from "../ports/CacheInvalidationPort.js";

export class DeleteMetricSettings {
  constructor(
    private repo: MetricSettingsRepository,
    private cache: CacheInvalidationPort
  ) {}

  async execute(userId: string, settingsId: string): Promise<void> {
    if (!userId) throw new AppError("User not authenticated", 401);
    const settings = await this.repo.findById(userId, settingsId);
    if (!settings) throw new AppError("Metric Settings not found", 404);

    await this.repo.delete(settings);
    await this.cache.invalidate(userId, settings.metricId, settings.id);
  }
}
