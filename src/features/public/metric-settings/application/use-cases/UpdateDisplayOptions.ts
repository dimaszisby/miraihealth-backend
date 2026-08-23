import AppError from "@/utils/AppError.js";
import { MetricSettingsRepository } from "../../domain/repositories/MetricSettingsRepository.js";
import { CacheInvalidationPort } from "../ports/CacheInvalidationPort.js";
import { MetricSettings } from "../../domain/entities/MetricSettings.js";
import { DisplayOptionsDTO } from "../../infrastructure/http/dto.js";

export class UpdateDisplayOptions {
  constructor(
    private repo: MetricSettingsRepository,
    private cache: CacheInvalidationPort,
  ) {}

  async execute(
    userId: string,
    organizationId: string,
    settingsId: string,
    displayOptions: Partial<DisplayOptionsDTO>,
  ): Promise<MetricSettings> {
    if (!userId) throw new AppError("User not authenticated", 401);
    const settings = await this.repo.findById(
      userId,
      organizationId,
      settingsId,
    );
    if (!settings) throw new AppError("Metric Settings not found", 404);
    const current = settings.snapshot().displayOptions;

    settings.updateDisplayOptions({
      showOnDashboard:
        displayOptions.showOnDashboard ?? current.showOnDashboard,
      priority: displayOptions.priority ?? current.priority,
      chartType: displayOptions.chartType ?? current.chartType,
      color: displayOptions.color ?? current.color,
    });

    const saved = await this.repo.save(organizationId, settings);
    await this.cache.invalidate(
      userId,
      organizationId,
      settings.metricId,
      settings.id,
    );
    return saved;
  }
}
