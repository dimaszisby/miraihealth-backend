import { models } from "@/infrastructure/db/models";
import { MetricAccessPort } from "../ports/MetricAccessPort";
import { CachePort } from "../ports/CachePort";
import { MetricLogDomain } from "@/types/domain/metric-log.domain";
import { toDomainMetricLog } from "@/utils/mappers/metric-log.mapper";

type Input = {
  userId: string;
  metricId: string;
  count: number;
};

const TYPES: Array<"manual" | "automatic"> = ["manual", "automatic"];

export class GenerateDummyMetricLogs {
  constructor(
    private access: MetricAccessPort,
    private cache: CachePort
  ) {}

  async execute({ userId, metricId, count }: Input): Promise<MetricLogDomain[]> {
    await this.access.ensureMetricOwnership(userId, metricId);

    const logs: MetricLogDomain[] = [];
    for (let i = 0; i < count; i++) {
      const created = await models.MetricLog.create({
        metricId,
        logValue: Number((Math.random() * 100).toFixed(2)),
        loggedAt: new Date(
          Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
        ),
        type: TYPES[Math.floor(Math.random() * TYPES.length)],
      });
      logs.push(toDomainMetricLog(created));
    }

    if (this.cache.isEnabled()) {
      await this.cache.invalidate(userId, metricId);
    }

    return logs;
  }
}
