import AppError from "@/utils/AppError";
import { MetricLogRepository } from "../../domain/repositories/MetricLogRepository";
import { MetricLog } from "../../domain/entities/MetricLog";
import { CachePort } from "../ports/CachePort";

type Input = {
  userId: string;
  logId: string;
};

export class DeleteMetricLog {
  constructor(
    private repo: MetricLogRepository,
    private cache: CachePort
  ) {}

  async execute({ userId, logId }: Input): Promise<MetricLog> {
    const log = await this.repo.findById(userId, logId);
    if (!log) throw new AppError("Log not found", 404);

    await this.repo.delete(log);
    if (this.cache.isEnabled()) {
      await this.cache.invalidate(userId, log.metricId, log.id);
    }
    return log;
  }
}
