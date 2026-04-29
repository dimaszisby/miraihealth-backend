import { MetricRepository } from "../../domain/repositories/MetricRepository.js";
import { CachePort } from "../ports/CachePort.js";

type Input = {
  userId: string;
  metricId: string;
};

export class DeleteMetric {
  constructor(
    private repo: MetricRepository,
    private cache: CachePort,
  ) {}

  async execute({ userId, metricId }: Input) {
    const metric = await this.repo.findOwnedById(userId, metricId);

    if (this.cache.isEnabled() && metric.id) {
      await this.cache.invalidateMetrics(userId, metric.id);
    }

    await this.repo.delete(metric);

    return metric;
  }
}
