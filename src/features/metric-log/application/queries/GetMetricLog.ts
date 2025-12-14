import AppError from "@/utils/AppError";
import { MetricLogRepository } from "../../domain/repositories/MetricLogRepository";
import { MetricLog } from "../../domain/entities/MetricLog";

type Input = {
  userId: string;
  logId: string;
};

export class GetMetricLog {
  constructor(private repo: MetricLogRepository) {}

  async execute({ userId, logId }: Input): Promise<MetricLog> {
    const log = await this.repo.findById(userId, logId);
    if (!log) throw new AppError("Log not found", 404);
    return log;
  }
}
