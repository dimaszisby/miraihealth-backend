// src/services/metric-service.ts
import db from "../models/index.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

// Now that our DB is correctly typed, these are the model classes.
const { Metric, MetricCategory, MetricSettings, MetricLog } = db;

/**
 * Create a new metric for a user.
 * This function checks for duplicate metric names and verifies that,
 * if a categoryId is provided, that category exists for the user.
 *
 * @param userId - ID of the user creating the metric.
 * @param data - Metric creation parameters.
 * @returns The created Metric instance.
 * @throws AppError if a duplicate exists or the category is not found.
 */
export const createMetricData = async (
  userId: string,
  data: {
    categoryId?: string;
    originalMetricId?: string;
    name: string;
    description?: string;
    defaultUnit: string;
    isPublic: boolean;
  }
) => {
  try {
    // Check for duplicate metric name for the user
    const existingMetric = await Metric.findOne({
      where: { userId, name: data.name },
    });
    if (existingMetric) {
      throw new AppError("Metric already exists", 400);
    }

    // If categoryId is provided, verify that the category exists for the user
    if (data.categoryId) {
      const category = await MetricCategory.findOne({
        where: { id: data.categoryId, userId },
      });
      if (!category) {
        throw new AppError("Category not found", 404);
      }
    }

    // Create the metric
    const metric = await Metric.create({ userId, ...data });
    return metric;
  } catch (error) {
    logger.error(`Error in createMetricData: ${(error as Error).stack}`);
    throw error;
  }
};

export interface MetricData {
  id: string;
  name: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  goalType?: string;
}

/**
 * Fetch all metrics for a user including category and settings.
 * @param userId - ID of the user requesting the data
 * @returns Array of formatted metrics
 */
export const getMetricData = async (userId: string): Promise<MetricData[]> => {
  try {
    // Verify that the models are loaded by logging their names.
    console.log("Inside getMetricData:");
    console.log("Metric model:", Metric.name);
    console.log("MetricCategory model:", MetricCategory.name);
    console.log("MetricSettings model:", MetricSettings.name);

    const metrics = await Metric.findAll({
      where: { userId },
      include: [
        {
          model: MetricCategory,
          as: "MetricCategory",
          attributes: ["id", "name", "icon", "color"],
        },
        {
          model: MetricSettings,
          as: "MetricSettings",
          attributes: ["goalType"],
        },
      ],
    });

    logger.info(`Fetched ${metrics.length} metrics for user ${userId}`);

    // Transform each metric: nest the category data under the property 'category'
    const transformed: MetricData[] = metrics.map((metric) => {
      const plainMetric = metric.toJSON();
      // Extract the category (if any) and remove it from the top level.
      const { MetricCategory, MetricSettings, ...rest } = plainMetric;
      return {
        ...rest,
        // Nest the category data if it exists.
        category: MetricCategory
          ? {
              id: MetricCategory.id,
              name: MetricCategory.name,
              icon: MetricCategory.icon,
              color: MetricCategory.color,
            }
          : undefined,
        goalType: MetricSettings?.goalType ?? undefined,
      };
    });

    return transformed;
  } catch (error) {
    logger.error(`Error in getMetricData: ${(error as Error).stack}`);
    throw new AppError("Failed to retrieve metrics", 500);
  }
};

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
 * @param userId - ID of the user requesting the data
 * @param metricId - ID of the metric to fetch
 * @returns Metric detail object or null if not found
 */
export const getMetricDetailData = async (
  userId: string,
  metricId: string
): Promise<MetricDetail | null> => {
  try {
    console.log(
      `Fetching details for metricId: ${metricId} and userId: ${userId}`
    );

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
      console.log("No metric found.");
      return null;
    }

    return {
      id: metric.id,
      name: metric.name,
      description: metric.description || undefined,
      defaultUnit: metric.defaultUnit,
      isPublic: metric.isPublic,
      category: (metric as any).MetricCategory || undefined,
      settings: (metric as any).MetricSettings || undefined,
      logs: (metric as any).MetricLogs || undefined,
    };
  } catch (error) {
    logger.error(`Error in getMetricDetailData: ${(error as Error).stack}`);
    throw new AppError("Failed to retrieve metric details", 500);
  }
};
