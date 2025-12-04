import { findOwnedMetric } from "@/utils/db-helper";
import { MetricDomain } from "@/types/domain/metric.domain";
import { toDomainMetric } from "@/utils/mappers/metric.mapper";
import { CachePort } from "../ports/CachePort";

type Input = {
  userId: string;
  metricId: string;
};

export class DeleteMetric {
  constructor(private cache: CachePort) {}

  async execute({ userId, metricId }: Input): Promise<MetricDomain> {
    const metric = await findOwnedMetric(userId, metricId);

    if (this.cache.isEnabled() && metric.id) {
      await this.cache.invalidateMetrics(userId, metric.id);
    }

    await metric.destroy();

    return toDomainMetric(metric);
  }
}
