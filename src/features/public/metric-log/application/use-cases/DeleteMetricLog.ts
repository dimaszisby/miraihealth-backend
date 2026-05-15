import AppError from "@/utils/AppError.js";
import { MetricLogRepository } from "../../domain/repositories/MetricLogRepository.js";
import { MetricLog } from "../../domain/entities/MetricLog.js";
import { CachePort } from "../ports/CachePort.js";

type Input = {
  userId: string;
  organizationId: string;
  logId: string;
};

export class DeleteMetricLog {
  constructor(
    private repo: MetricLogRepository,
    private cache: CachePort,
  ) {}

  async execute({ userId, organizationId, logId }: Input): Promise<MetricLog> {
    const log = await this.repo.findById(userId, organizationId, logId);
    if (!log) throw new AppError("Log not found", 404);

    await this.repo.delete(organizationId, log);
    if (this.cache.isEnabled()) {
      await this.cache.invalidate(userId, log.metricId, log.id);
    }
    return log;
  }
}
