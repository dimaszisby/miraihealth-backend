import type { FindOptions, Includeable, WhereOptions } from "sequelize";
import { models } from "../../../../../infrastructure/db/models.js";
import type { MetricLogAttributes } from "../../infrastructure/persistence/models/metric-log.sequelize.js";
import { MetricAccessPort } from "../ports/MetricAccessPort.js";

type Input = {
  userId: string;
  organizationId: string;
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

  async execute({ userId, organizationId, metricId }: Input): Promise<Stats> {
    if (metricId) {
      await this.access.ensureMetricOwnership(userId, organizationId, metricId);
    }

    // Two intentionally different scoping strategies:
    // - With metricId: org boundary enforced directly on the log row (metricId already
    //   identifies the metric, ownership was checked above via ensureMetricOwnership).
    // - Without metricId: org boundary enforced via INNER JOIN on Metric with
    //   { userId, organizationId } so only logs belonging to this user's metrics in
    //   this org are aggregated. A plain WHERE on the log row would be insufficient
    //   because metric_logs only carries organizationId, not userId.
    const where: WhereOptions<MetricLogAttributes> = metricId
      ? { metricId, organizationId }
      : { organizationId };
    const query: FindOptions<MetricLogAttributes> = { where };

    if (!metricId) {
      const metricInclude: Includeable = {
        model: models.Metric,
        as: "metric",
        attributes: [],
        required: true,
        where: { userId, organizationId },
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
