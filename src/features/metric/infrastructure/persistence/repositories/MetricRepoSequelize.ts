import { models } from "@/infrastructure/db/models.js";
import { Transaction } from "sequelize";
import {
  CreateMetricDTO,
  MetricRepository,
} from "../../../domain/repositories/MetricRepository.js";
import { Metric } from "../../../domain/entities/Metric.js";
import { PersistenceTransaction } from "../../../application/ports/PersistenceTransaction.js";
import { MetricRow, toDomain } from "../mappers/MetricMapper.js";
import AppError from "@/utils/AppError.js";

export class MetricRepoSequelize implements MetricRepository {
  async existsByName(userId: string, name: string): Promise<boolean> {
    const count = await models.Metric.count({ where: { userId, name } });
    return count > 0;
  }

  async categoryExists(userId: string, categoryId: string): Promise<boolean> {
    const count = await models.MetricCategory.count({
      where: { userId, id: categoryId },
    });
    return count > 0;
  }

  async create(
    data: CreateMetricDTO,
    tx: PersistenceTransaction,
  ): Promise<Metric> {
    const transaction = tx as Transaction;
    const created = await models.Metric.create(
      {
        userId: data.userId,
        categoryId: data.categoryId ?? null,
        originalMetricId: data.originalMetricId ?? null,
        name: data.name,
        description: data.description ?? null,
        defaultUnit: data.defaultUnit,
        isPublic: data.isPublic,
      },
      { transaction },
    );

    await created.reload({ transaction });

    const row: MetricRow = {
      id: created.id,
      userId: created.userId,
      categoryId: created.categoryId,
      originalMetricId: created.originalMetricId,
      name: created.name,
      description: created.description,
      defaultUnit: created.defaultUnit,
      isPublic: created.isPublic,
      createdAt: created.createdAt!,
      updatedAt: created.updatedAt!,
      deletedAt: created.deletedAt ?? null,
    };

    return toDomain(row);
  }

  async findOwnedById(userId: string, metricId: string): Promise<Metric> {
    const metric = await models.Metric.findOne({
      where: { id: metricId, userId },
    });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    const row: MetricRow = {
      id: metric.id,
      userId: metric.userId,
      categoryId: metric.categoryId,
      originalMetricId: metric.originalMetricId,
      name: metric.name,
      description: metric.description,
      defaultUnit: metric.defaultUnit,
      isPublic: metric.isPublic,
      createdAt: metric.createdAt!,
      updatedAt: metric.updatedAt!,
      deletedAt: metric.deletedAt ?? null,
    };

    return toDomain(row);
  }

  async save(metric: Metric): Promise<Metric> {
    const instance = await models.Metric.findOne({
      where: { id: metric.id, userId: metric.userId },
    });
    if (!instance) throw new AppError("Metric not found", 404);

    const snapshot = metric.snapshot();
    await instance.update({
      name: snapshot.name,
      description: snapshot.description,
      defaultUnit: snapshot.defaultUnit,
      categoryId: snapshot.categoryId,
      originalMetricId: snapshot.originalMetricId ?? null,
      isPublic: snapshot.isPublic,
    });
    await instance.reload();

    return toDomain({
      id: instance.id,
      userId: instance.userId,
      categoryId: instance.categoryId,
      originalMetricId: instance.originalMetricId,
      name: instance.name,
      description: instance.description,
      defaultUnit: instance.defaultUnit,
      isPublic: instance.isPublic,
      createdAt: instance.createdAt!,
      updatedAt: instance.updatedAt!,
      deletedAt: instance.deletedAt ?? null,
    });
  }

  async delete(metric: Metric): Promise<void> {
    const instance = await models.Metric.findOne({
      where: { id: metric.id, userId: metric.userId },
    });
    if (!instance) throw new AppError("Metric not found", 404);
    await instance.destroy();
  }
}
