const {
  Metric,
  MetricCategory,
  MetricSettings,
  MetricLog,
} = require("../models");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger"); // ✅ Use logger


const getMetricData = async (userId) => {
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

    // Debugging: Log fetched metrics
    console.log("Fetched Metrics:", metrics);

    // Transform data as needed for the frontend
    return metrics.map((metric) => ({
      id: metric.id,
      name: metric.name,
      categoryName: metric.MetricCategory ? metric.MetricCategory.name : null,
      categoryIcon: metric.MetricCategory ? metric.MetricCategory.icon : null,
      goalType: metric.MetricSettings ? metric.MetricSettings.goalType : null,
    }));
  } catch (error) {
    logger.error(`Error in getMetricDetailData: ${error.stack}`); // ✅ Log full error stack
    throw new AppError("Failed to retrieve metrics", 500);
  }
};

/**
 * Fetches metric detail including related entities
 * @param {string} userId - ID of the user requesting the data
 * @param {string} metricId - ID of the metric to fetch
 * @returns {object} Metric detail including category, settings, and logs
 */
const getMetricDetailData = async (userId, metricId) => {
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
          order: [["createdAt", "DESC"]], // Fetch logs in descending order of creation
        },
      ],
    });

    if (!metric) {
      return null; // Return null if metric not found
    }

    // Transform and structure data for API response
    return {
      id: metric.id,
      name: metric.name,
      description: metric.description,
      defaultUnit: metric.defaultUnit,
      isPublic: metric.isPublic,
      category: metric.MetricCategory || null,
      settings: metric.MetricSettings || null,
      logs: metric.MetricLogs || [],
    };
  } catch (error) {
    logger.error(`Error in getMetricDetailData: ${error.stack}`); // ✅ Log full error stack
    throw new AppError(`Failed to retrieve metrics ${error}`, 500);
  }
};

module.exports = {
  getMetricData,
  getMetricDetailData,
};
