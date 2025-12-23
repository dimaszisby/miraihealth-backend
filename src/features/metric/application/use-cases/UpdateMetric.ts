import { UpdateMetricRequestDTO } from "@/types/dtos/metric.dto.js";
import { MetricRepository } from "../../domain/repositories/MetricRepository.js";
import { CachePort } from "../ports/CachePort.js";

type Input = {
  userId: string;
  metricId: string;
  data: UpdateMetricRequestDTO;
};

export class UpdateMetric {
  constructor(
    private repo: MetricRepository,
    private cache: CachePort
  ) {}

  async execute({ userId, metricId, data }: Input) {
    const metric = await this.repo.findOwnedById(userId, metricId);

    metric.update({
      name: data.name,
      description: data.description ?? null,
      defaultUnit: data.defaultUnit,
      categoryId: data.categoryId ?? null,
      isPublic: data.isPublic ?? metric.isPublic,
    });

    const saved = await this.repo.save(metric);

    if (this.cache.isEnabled() && metric.id) {
      await this.cache.invalidateMetrics(userId, metric.id);
    }

    return saved;
  }
}
