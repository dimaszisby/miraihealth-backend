import { UpdateMetricRequestDTO } from "@/types/dtos/metric.dto.js";
import { MetricRepository } from "../../domain/repositories/MetricRepository.js";
import { CachePort } from "../ports/CachePort.js";
import AppError from "@/utils/AppError.js";

type Input = {
  userId: string;
  metricId: string;
  data: UpdateMetricRequestDTO;
};

export class UpdateMetric {
  constructor(
    private repo: MetricRepository,
    private cache: CachePort,
  ) {}

  async execute({ userId, metricId, data }: Input) {
    const metric = await this.repo.findOwnedById(userId, metricId);

    if (data.categoryId != null) {
      const exists = await this.repo.categoryExists(userId, data.categoryId);
      if (!exists) throw new AppError("Category not found", 404);
    }

    if (data.originalMetricId != null) {
      const exists = await this.repo.originalMetricExists(
        userId,
        data.originalMetricId,
      );
      if (!exists) throw new AppError("Original metric not found", 404);
    }

    if (data.name !== undefined) {
      const normalizedName = data.name.trim().toLowerCase();
      const currentName = metric.name.trim().toLowerCase();
      if (normalizedName !== currentName) {
        const exists = await this.repo.existsByName(userId, data.name);
        if (exists) throw new AppError("Metric already exists", 409);
      }
    }

    const update: UpdateMetricRequestDTO = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) {
      update.description = data.description ?? null;
    }
    if (data.defaultUnit !== undefined) update.defaultUnit = data.defaultUnit;
    if (data.categoryId !== undefined)
      update.categoryId = data.categoryId ?? null;
    if (data.originalMetricId !== undefined) {
      update.originalMetricId = data.originalMetricId ?? null;
    }
    if (data.isPublic !== undefined) update.isPublic = data.isPublic;

    if (!Object.keys(update).length) {
      throw new AppError("Update payload cannot be empty", 400);
    }

    metric.update(update);

    const saved = await this.repo.save(metric);

    if (this.cache.isEnabled() && metric.id) {
      await this.cache.invalidateMetrics(userId, metric.id);
    }

    return saved;
  }
}
