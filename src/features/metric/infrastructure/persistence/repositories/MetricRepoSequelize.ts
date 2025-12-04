import { models } from "@/models";
import { Transaction } from "sequelize";
import {
  CreateMetricDTO,
  MetricRepository,
} from "../../../domain/repositories/MetricRepository";
import { Metric } from "../../../domain/entities/Metric";
import { PersistenceTransaction } from "../../../application/ports/PersistenceTransaction";
import { MetricRow, toDomain } from "../mappers/MetricMapper";

export class MetricRepoSequelize implements MetricRepository {
  async existsByName(userId: string, name: string): Promise<boolean> {
    const count = await models.Metric.count({ where: { userId, name } });
    return count > 0;
  }

  async categoryExists(
    userId: string,
    categoryId: string
  ): Promise<boolean> {
    const count = await models.MetricCategory.count({
      where: { userId, id: categoryId },
    });
    return count > 0;
  }

  async create(
    data: CreateMetricDTO,
    tx: PersistenceTransaction
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
      { transaction }
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
}
