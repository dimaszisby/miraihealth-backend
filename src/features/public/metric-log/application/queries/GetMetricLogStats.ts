import type { FindOptions, Includeable, WhereOptions } from "sequelize";
import { models } from "../../../../../infrastructure/db/models.js";
import type { MetricLogAttributes } from "../../infrastructure/persistence/models/metric-log.sequelize.js";
import { MetricAccessPort } from "../ports/MetricAccessPort.js";

type Input = {
  userId: string;
  metricId?: string;
};

type Stats = {
  average: number;
  min: number;
  max: number;
};
type LogWithValue = Pick<MetricLogAttributes, "logValue">;
const EMPTY_STATS: Stats = { average: 0, min: 0, max: 0 };

export class GetMetricLogStats {
  constructor(private access: MetricAccessPort) {}

  async execute({ userId, metricId }: Input): Promise<Stats> {
    if (metricId) {
      await this.access.ensureMetricOwnership(userId, metricId);
    }

    const where: WhereOptions<MetricLogAttributes> = metricId
      ? { metricId }
      : {};
    const query: FindOptions<MetricLogAttributes> = { where };

    if (!metricId) {
      const metricInclude: Includeable = {
        model: models.Metric,
        as: "metric",
        attributes: [],
        required: true,
        where: { userId },
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
