import { Op } from "sequelize";
import { models } from "@/infrastructure/db/models.js";
import AppError from "@/utils/AppError.js";
import {
  CreateMetricLogDTO,
  MetricLogRepository,
} from "../../../domain/repositories/MetricLogRepository.js";
import { MetricLog } from "../../../domain/entities/MetricLog.js";
import { MetricLogRow, toDomain } from "../mappers/MetricLogMapper.js";
import type { MetricLog as MetricLogModel } from "../models/metric-log.sequelize.js";

function toRow(model: MetricLogModel): MetricLogRow {
  return {
    id: model.id,
    metricId: model.metricId,
    logValue: model.logValue,
    type: model.type as "manual" | "automatic",
    loggedAt: model.loggedAt!,
    createdAt: model.createdAt!,
    updatedAt: model.updatedAt!,
  };
}

export class MetricLogRepoSequelize implements MetricLogRepository {
  async existsAtTimestamp(
    metricId: string,
    loggedAt: Date,
    excludeLogId?: string,
  ): Promise<boolean> {
    const where: {
      metricId: string;
      loggedAt: Date;
      id?: Record<typeof Op.ne, string>;
    } = { metricId, loggedAt };
    if (excludeLogId) {
      where.id = { [Op.ne]: excludeLogId };
    }

    const count = await models.MetricLog.count({
      where,
    });
    return count > 0;
  }

  async create(data: CreateMetricLogDTO): Promise<MetricLog> {
    const created = await models.MetricLog.create({
      metricId: data.metricId,
      logValue: data.logValue,
      type: data.type,
      loggedAt: data.loggedAt,
    });

    await created.reload();
    return toDomain(toRow(created));
  }

  async findById(userId: string, logId: string): Promise<MetricLog | null> {
    const log = await models.MetricLog.findOne({
      where: { id: logId },
      include: [
        {
          model: models.Metric,
          as: "metric",
          attributes: ["userId"],
          required: true,
          where: { userId },
        },
      ],
    });

    if (!log) return null;
    return toDomain(toRow(log));
  }

  async save(log: MetricLog): Promise<MetricLog> {
    const existing = await models.MetricLog.findByPk(log.id);
    if (!existing) throw new AppError("Log not found", 404);

    await existing.update({
      logValue: log.logValue,
      type: log.type,
      loggedAt: log.loggedAt,
    });
    await existing.reload();

    return toDomain(toRow(existing));
  }

  async delete(log: MetricLog): Promise<void> {
    await models.MetricLog.destroy({ where: { id: log.id } });
  }
}
