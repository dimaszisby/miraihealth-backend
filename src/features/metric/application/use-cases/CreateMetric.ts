import AppError from "@/utils/AppError";
import { Metric } from "../../domain/entities/Metric";
import {
  CreateMetricDTO,
  MetricRepository,
} from "../../domain/repositories/MetricRepository";
import { CachePort } from "../ports/CachePort";
import { MetricSettingsPort } from "../ports/MetricSettingsPort";
import { TransactionPort } from "../ports/TransactionPort";

type Input = CreateMetricDTO;

export class CreateMetric {
  constructor(
    private repo: MetricRepository,
    private settings: MetricSettingsPort,
    private cache: CachePort,
    private tx: TransactionPort
  ) {}

  async execute(input: Input): Promise<Metric> {
    if (await this.repo.existsByName(input.userId, input.name)) {
      throw new AppError("Metric already exists", 409);
    }

    if (input.categoryId) {
      const exists = await this.repo.categoryExists(
        input.userId,
        input.categoryId
      );
      if (!exists) throw new AppError("Category not found", 404);
    }

    return this.tx.runInTransaction(async (t) => {
      const metric = await this.repo.create(input, t);

      await this.settings.createDefault(metric.id, t);

      if (this.cache.isEnabled()) {
        await this.cache.invalidateMetrics(metric.userId, metric.id);
      }

      return metric;
    });
  }
}
