import { models } from "@/infrastructure/db/models.js";
import { Op } from "sequelize";
import type { MetricLog } from "@/features/metric-log/infrastructure/persistence/models/metric-log.sequelize.js";
import type {
  TrendRepository,
  TrendQueryCriteria,
  TrendPoint,
} from "../../application/ports/TrendRepository.js";

export class TrendRepoSequelize implements TrendRepository {
  async findTrendPoints(criteria: TrendQueryCriteria): Promise<TrendPoint[]> {
    const logs = await models.MetricLog.findAll({
      where: {
        metricId: criteria.metricId,
        organizationId: criteria.organizationId,
        createdAt: { [Op.gte]: criteria.since },
      },
      order: [["createdAt", "ASC"]],
      attributes: ["createdAt", "logValue"],
    });

    return logs.map(
      (log: MetricLog): TrendPoint => ({
        date: log.createdAt!,
        value: log.logValue,
      }),
    );
  }
}
