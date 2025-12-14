import AppError from "@/utils/AppError";
import { MetricSettingsRepository } from "../../domain/repositories/MetricSettingsRepository";
import { CacheInvalidationPort } from "../ports/CacheInvalidationPort";
import { MetricSettings } from "../../domain/entities/MetricSettings";

export class UpdateGoalAchievement {
  constructor(
    private repo: MetricSettingsRepository,
    private cache: CacheInvalidationPort
  ) {}

  async execute(userId: string, settingsId: string): Promise<MetricSettings> {
    if (!userId) throw new AppError("User not authenticated", 401);
    const settings = await this.repo.findById(userId, settingsId);
    if (!settings) throw new AppError("Metric Settings not found", 404);

    settings.markAchieved();
    const saved = await this.repo.save(settings);
    await this.cache.invalidate(userId, settings.metricId, settings.id);
    return saved;
  }
}
