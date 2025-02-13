import { Metric } from "../models/metric.js";
import { MetricCategory } from "../models/metric-category.js";
import { MetricSettings } from "../models/metric-settings.js";
import { MetricLog } from "../models/metric-log.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

/**
 * * Service to Fetch User Metrics
 * Fetches all metrics belonging to a user along with related data.
 */

export interface MetricData {
  id: string;
  name: string;
  categoryName?: string;
  categoryIcon?: string;
  goalType?: string;
}

/**
 * Fetch all metrics for a user including category and settings.
 * @param {string} userId - ID of the user requesting the data
 * @returns {Promise<MetricData[]>} Array of formatted metrics
 */
export const getMetricData = async (userId: string): Promise<MetricData[]> => {
  try {
    const metrics = await Metric.findAll({
      where: { userId },
      include: [
        {
          model: MetricCategory,
          attributes: ["name", "icon"],
          as: "MetricCategory",
        },
        {
          model: MetricSettings,
          attributes: ["goalType"],
          as: "MetricSettings",
        },
      ],
    });

    logger.info(`Fetched ${metrics.length} metrics for user ${userId}`);

    return metrics.map((metric) => ({
      id: metric.id,
      name: metric.name,
      categoryName: metric.MetricCategory?.name, // ✅ Safe property access
      categoryIcon: metric.MetricCategory?.icon, // ✅ Safe property access
      goalType: metric.MetricSettings?.goalType ?? undefined, // Convert null to undefined
    }));
  } catch (error) {
    logger.error(`Error in getMetricData: ${(error as Error).stack}`);
    throw new AppError("Failed to retrieve metrics", 500);
  }
};

/**
 * * Service to Fetch Metric Detail
 * Fetches detailed information of a specific metric, including settings and logs.
 */

export interface MetricDetail {
  id: string;
  name: string;
  description?: string;
  defaultUnit: string;
  isPublic: boolean;
  category?: object;
  settings?: object;
  logs?: object[];
}

/**
 * Fetch metric details including related category, settings, and logs.
 * @param {string} userId - ID of the user requesting the data
 * @param {string} metricId - ID of the metric to fetch
 * @returns {Promise<MetricDetail | null>} Metric detail object or null if not found
 */
export const getMetricDetailData = async (
  userId: string,
  metricId: string
): Promise<MetricDetail | null> => {
  try {
    const metric = await Metric.findOne({
      where: { id: metricId, userId },
      include: [
        {
          model: MetricCategory,
          attributes: ["id", "name", "color", "icon"],
          as: "MetricCategory",
        },
        {
          model: MetricSettings,
          attributes: [
            "id",
            "goalType",
            "goalValue",
            "startDate",
            "deadlineDate",
            "alertThresholds",
            "isAchieved",
            "isActive",
            "displayOptions",
          ],
          as: "MetricSettings",
        },
        {
          model: MetricLog,
          attributes: ["id", "logValue", "type", "createdAt"],
          order: [["createdAt", "DESC"]],
          as: "MetricLogs",
        },
      ],
    });

    if (!metric) {
      return null;
    }

    return {
      id: metric.id,
      name: metric.name,
      description: metric.description || undefined,
      defaultUnit: metric.defaultUnit,
      isPublic: metric.isPublic,
      category: metric.MetricCategory || undefined,
      settings: metric.MetricSettings || undefined,
      logs: metric.MetricLogs || undefined,
    };
  } catch (error) {
    logger.error(`Error in getMetricDetailData: ${(error as Error).stack}`);
    throw new AppError("Failed to retrieve metric details", 500);
  }
};
