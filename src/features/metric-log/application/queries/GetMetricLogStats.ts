import { models } from "@/infrastructure/db/models";
import { MetricAccessPort } from "../ports/MetricAccessPort";

type Input = {
  userId: string;
  metricId?: string;
};

type Stats = {
  average: number;
  min: number;
  max: number;
};

export class GetMetricLogStats {
  constructor(private access: MetricAccessPort) {}

  async execute({ userId, metricId }: Input): Promise<Stats> {
    const where: any = {};
    const query: any = { where };

    if (metricId) {
      await this.access.ensureMetricOwnership(userId, metricId);
      where.metricId = metricId;
    } else {
      query.include = [
        {
          model: models.Metric,
          as: "metric",
          attributes: [],
          required: true,
          where: { userId },
        },
      ];
    }

    const logs = await models.MetricLog.findAll(query);
    if (!logs.length) return { average: 0, min: 0, max: 0 };

    const values = logs.map((log: any) => Number(log.logValue) || 0);
    const total = values.reduce((sum, v) => sum + v, 0);
    return {
      average: total / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
}
