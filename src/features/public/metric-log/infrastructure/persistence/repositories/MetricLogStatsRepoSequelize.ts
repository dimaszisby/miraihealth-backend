import type { FindOptions, Includeable, WhereOptions } from "sequelize";
import { models } from "@/infrastructure/db/models.js";
import type { MetricLogAttributes } from "../models/metric-log.sequelize.js";
import type {
  MetricLogStatsPort,
  MetricLogStatsCriteria,
  MetricLogStats,
} from "../../../application/ports/MetricLogStatsPort.js";

type LogWithValue = Pick<MetricLogAttributes, "logValue">;
const EMPTY_STATS: MetricLogStats = { average: 0, min: 0, max: 0 };

export class MetricLogStatsRepoSequelize implements MetricLogStatsPort {
  async computeStats(
    criteria: MetricLogStatsCriteria,
  ): Promise<MetricLogStats> {
    const where: WhereOptions<MetricLogAttributes> = criteria.metricId
      ? { metricId: criteria.metricId, organizationId: criteria.organizationId }
      : { organizationId: criteria.organizationId };
    const query: FindOptions<MetricLogAttributes> = { where };

    if (!criteria.metricId) {
      const metricInclude: Includeable = {
        model: models.Metric,
        as: "metric",
        attributes: [],
        required: true,
        where: {
          userId: criteria.userId,
          organizationId: criteria.organizationId,
        },
      };
      query.include = [metricInclude];
    }

    const logs = (await models.MetricLog.findAll(query)) as LogWithValue[];
    if (!logs.length) return EMPTY_STATS;

    const values = logs.map((log) => Number(log.logValue) || 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      average: total / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
}
