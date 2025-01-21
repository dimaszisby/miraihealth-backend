const { Metric, MetricCategory, MetricSettings } = require("../models");

const getMetricData = async (userId) => {
  const metrics = await Metric.findAll({
    where: { userId },
    include: [
      {
        model: MetricCategory,
        attributes: ["name", "icon"],
      },
      {
        model: MetricSettings,
        attributes: ["isTracked"],
      },
    ],
  });

  // Transform data as needed for the frontend
  return metrics.map((metric) => ({
    id: metric.id,
    name: metric.name,
    categoryName: metric.MetricCategory ? metric.MetricCategory.name : null,
    categoryIcon: metric.MetricCategory ? metric.MetricCategory.icon : null,
    isTracked: metric.MetricSettings.isTracked ? metric.MetricSettings : null,
  }));
};

module.exports = {
  getMetricData,
};
