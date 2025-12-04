import { UpdateMetricRequestDTO } from "@/types/dtos/metric.dto";
import { findOwnedMetric } from "@/utils/db-helper";
import { MetricDomain } from "@/types/domain/metric.domain";
import { toDomainMetric } from "@/utils/mappers/metric.mapper";
import { CachePort } from "../ports/CachePort";

type Input = {
  userId: string;
  metricId: string;
  data: UpdateMetricRequestDTO;
};

export class UpdateMetric {
  constructor(private cache: CachePort) {}

  async execute({ userId, metricId, data }: Input): Promise<MetricDomain> {
    const metric = await findOwnedMetric(userId, metricId);

    await metric.update(data);
    await metric.reload();

    if (this.cache.isEnabled() && metric.id) {
      await this.cache.invalidateMetrics(userId, metric.id);
    }

    return toDomainMetric(metric);
  }
}
