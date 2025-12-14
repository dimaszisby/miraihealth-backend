import AppError from "@/utils/AppError";
import { MetricSettingsRepository } from "../../domain/repositories/MetricSettingsRepository";
import { CacheInvalidationPort } from "../ports/CacheInvalidationPort";
import { MetricSettings } from "../../domain/entities/MetricSettings";
import { DisplayOptionsDTO } from "../../infrastructure/http/dto";

export class UpdateDisplayOptions {
  constructor(
    private repo: MetricSettingsRepository,
    private cache: CacheInvalidationPort
  ) {}

  async execute(
    userId: string,
    settingsId: string,
    displayOptions: DisplayOptionsDTO
  ): Promise<MetricSettings> {
    if (!userId) throw new AppError("User not authenticated", 401);
    const settings = await this.repo.findById(userId, settingsId);
    if (!settings) throw new AppError("Metric Settings not found", 404);

    settings.updateDisplayOptions({
      showOnDashboard: Boolean(displayOptions.showOnDashboard),
      priority: displayOptions.priority ?? null,
      chartType: displayOptions.chartType ?? null,
      color: displayOptions.color ?? null,
    });

    const saved = await this.repo.save(settings);
    await this.cache.invalidate(userId, settings.metricId, settings.id);
    return saved;
  }
}
