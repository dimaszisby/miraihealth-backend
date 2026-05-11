import { models } from "@/infrastructure/db/models.js";
import { MetricDomain } from "@/types/domain/metric.domain.js";
import { toDomainMetric } from "@/utils/mappers/metric.mapper.js";
import { CachePort } from "../ports/CachePort.js";

type Input = {
  userId: string;
  organizationId: string;
  count: number;
};

const DEFAULT_UNITS = ["kg", "steps", "ml", "units"];

export class GenerateDummyMetrics {
  constructor(private cache: CachePort) {}

  async execute({
    userId,
    organizationId,
    count,
  }: Input): Promise<MetricDomain[]> {
    const dummyMetrics: MetricDomain[] = [];

    for (let i = 0; i < count; i++) {
      const metric = await models.Metric.create({
        userId,
        organizationId,
        name: `Dummy Metric ${Date.now()}-${i}`,
        description: "This is a dummy metric generated for testing pagination.",
        defaultUnit:
          DEFAULT_UNITS[Math.floor(Math.random() * DEFAULT_UNITS.length)],
        isPublic: Math.random() > 0.5,
      });
      dummyMetrics.push(toDomainMetric(metric));
    }

    if (this.cache.isEnabled()) {
      await this.cache.invalidateMetrics(userId);
    }

    return dummyMetrics;
  }
}
