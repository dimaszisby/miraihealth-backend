import AppError from "@/utils/AppError.js";
import { MetricSettings } from "../../domain/entities/MetricSettings.js";
import { MetricSettingsRepository } from "../../domain/repositories/MetricSettingsRepository.js";
import { CacheInvalidationPort } from "../ports/CacheInvalidationPort.js";
import { UpdateMetricSettingsRequestDTO } from "../../infrastructure/http/dto.js";

export class UpdateMetricSettings {
  constructor(
    private repo: MetricSettingsRepository,
    private cache: CacheInvalidationPort
  ) {}

  async execute(
    userId: string,
    settingsId: string,
    payload: Partial<UpdateMetricSettingsRequestDTO>
  ): Promise<MetricSettings> {
    if (!userId) throw new AppError("User not authenticated", 401);
    const settings = await this.repo.findById(userId, settingsId);
    if (!settings) throw new AppError("Metric Settings not found", 404);

    settings.updateDetails({
      goalEnabled: payload.goalEnabled,
      goalType: payload.goalType,
      goalValue: payload.goalValue,
      timeFrameEnabled: payload.timeFrameEnabled,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      deadlineDate: payload.deadlineDate ? new Date(payload.deadlineDate) : null,
      alertEnabled: payload.alertEnabled,
      alertThresholds: payload.alertThresholds,
      displayOptions: payload.displayOptions ?? undefined,
    });

    const saved = await this.repo.save(settings);
    await this.cache.invalidate(userId, settings.metricId, settings.id);
    return saved;
  }
}
