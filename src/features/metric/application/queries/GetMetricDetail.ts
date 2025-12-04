import { models } from "@/models";
import AppError from "@/utils/AppError";
import logger from "@/utils/logger";
import { MetricDomainExtended } from "@/types/domain/metric.domain";
import { toExtendedMetricDomain } from "@/utils/mappers/metric.mapper";

type IncludeKey = "settings" | "category" | "logs";

type Input = {
  userId: string;
  metricId: string;
  includes?: IncludeKey[];
  logsLimit?: number;
};

export class GetMetricDetail {
  async execute({
    userId,
    metricId,
    includes = [],
    logsLimit = 20,
  }: Input): Promise<MetricDomainExtended | null> {
    const includeArr: any[] = [];

    if (includes.includes("category")) {
      includeArr.push({
        model: models.MetricCategory,
        as: "category",
        attributes: ["id", "name", "color", "icon", "createdAt", "updatedAt"],
      });
    }

    if (includes.includes("settings")) {
      includeArr.push({
        model: models.MetricSettings,
        as: "settings",
        attributes: [
          "id",
          "metricId",
          "isActive",
          "goalEnabled",
          "goalType",
          "goalValue",
          "timeFrameEnabled",
          "startDate",
          "deadlineDate",
          "alertEnabled",
          "alertThresholds",
          "isAchieved",
          "displayOptions",
          "createdAt",
          "updatedAt",
        ],
      });
    }

    if (includes.includes("logs")) {
      includeArr.push({
        model: models.MetricLog,
        as: "logs",
        attributes: [
          "id",
          "logValue",
          "type",
          "loggedAt",
          "createdAt",
          "updatedAt",
        ],
        order: [["createdAt", "DESC"]],
        limit: logsLimit,
      });
    }

    const metric = await models.Metric.findOne({
      where: { id: metricId, userId },
      include: includeArr,
    });

    if (!metric) {
      logger.info("No metric found.");
      return null;
    }

    if (!metric.isPublic && metric.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    return toExtendedMetricDomain(metric);
  }
}
