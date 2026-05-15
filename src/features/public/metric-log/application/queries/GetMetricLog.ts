import AppError from "@/utils/AppError.js";
import { MetricLogRepository } from "../../domain/repositories/MetricLogRepository.js";
import { MetricLog } from "../../domain/entities/MetricLog.js";

type Input = {
  userId: string;
  organizationId: string;
  logId: string;
};

export class GetMetricLog {
  constructor(private repo: MetricLogRepository) {}

  async execute({ userId, organizationId, logId }: Input): Promise<MetricLog> {
    const log = await this.repo.findById(userId, organizationId, logId);
    if (!log) throw new AppError("Log not found", 404);
    return log;
  }
}
