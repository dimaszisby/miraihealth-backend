import AppError from "@/utils/AppError";
import { parseIsoToDate } from "@/utils/date-io";
import { MetricLogRepository } from "../../domain/repositories/MetricLogRepository";
import { MetricLog } from "../../domain/entities/MetricLog";
import { CachePort } from "../ports/CachePort";

type Input = {
  userId: string;
  logId: string;
  updates: Partial<{
    logValue: number;
    type: "manual" | "automatic";
    loggedAt: string | Date;
  }>;
};

export class UpdateMetricLog {
  constructor(
    private repo: MetricLogRepository,
    private cache: CachePort
  ) {}

  async execute({ userId, logId, updates }: Input): Promise<MetricLog> {
    const log = await this.repo.findById(userId, logId);
    if (!log) throw new AppError("Log not found", 404);

    if (typeof updates.logValue !== "undefined") {
      log.setLogValue(updates.logValue);
    }
    if (typeof updates.type !== "undefined") {
      log.setType(updates.type);
    }
    if (typeof updates.loggedAt !== "undefined") {
      const timestamp =
        updates.loggedAt instanceof Date
          ? updates.loggedAt
          : (parseIsoToDate(updates.loggedAt) as Date);
      if (Number.isNaN(timestamp.getTime())) {
        throw new AppError("loggedAt is invalid", 400);
      }
      if (
        await this.repo.existsAtTimestamp(log.metricId, timestamp, log.id)
      ) {
        throw new AppError(
          "A log entry already exists for this timestamp for this metric",
          400
        );
      }
      log.setLoggedAt(timestamp);
    }

    const saved = await this.repo.save(log);
    if (this.cache.isEnabled()) {
      await this.cache.invalidate(userId, saved.metricId, saved.id);
    }
    return saved;
  }
}
