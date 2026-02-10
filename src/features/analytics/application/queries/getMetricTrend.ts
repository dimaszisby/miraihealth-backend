import { models } from "@/infrastructure/db/models.js";
import { validateMetricAccess } from "@/utils/db-helper.js";
import AppError from "@/utils/AppError.js";
import { Op } from "sequelize";
import type { MetricLog } from "@/features/metric-log/infrastructure/persistence/models/metric-log.sequelize.js";

type GetMetricTrendInput = {
  userId: string;
  metricId: string;
  days?: number;
};

export type MetricTrendPoint = {
  date: Date;
  value: number;
};

export async function getMetricTrend({
  userId,
  metricId,
  days = 30,
}: GetMetricTrendInput): Promise<MetricTrendPoint[]> {
  if (!userId) throw new AppError("User not authenticated", 401);
  if (!metricId) throw new AppError("Metric ID is required", 400);

  await validateMetricAccess(userId, metricId);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await models.MetricLog.findAll({
    where: {
      metricId,
      createdAt: { [Op.gte]: since },
    },
    order: [["createdAt", "ASC"]],
    attributes: ["createdAt", "logValue"],
  });

  return logs.map(
    (log: MetricLog): MetricTrendPoint => ({
      date: log.createdAt!,
      value: log.logValue,
    }),
  );
}
