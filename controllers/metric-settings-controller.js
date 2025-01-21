const { Metric, MetricSettings } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { where } = require("sequelize");

exports.createMetricSettings = async (req, res) => {
  const metricId = req.params.metricId;
  const { isTracked, goalValue, versionDate } = req.body;

  console.log(`Received request to create Settings for metricId: ${metricId}`);
  console.log(`Request Body:`, req.body);

  // Validate params
  if (!metricId)
    return res
      .status(400)
      .json({ message: "MetricId is required for this function" });

  // Validate Body
  if (!isTracked || !goalValue || !versionDate)
    return res.status(400).json({
      message:
        "Required properties to create Settings for Metric are not complete",
    });

  try {
    // Validate Metric as a parent entity of Metic Settings
    const metric = await Metric.findOne({
      where: { id: metricId },
    });
    if (!metric) return res.status(404).json({ message: "Metric not found" });

    const settings = await MetricSettings.create({
      metricId: metric.id,
      isTracked,
      goalValue,
      versionDate,
    });
    if (!settings)
      return res.status(404).json({ message: "Settings for Metric not found" });

    res
      .status(201)
      .json({ message: "Metric Settings created successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllMetricSettings = async (req, res) => {
  const metricId = req.params.metricId;

  // Validate params
  if (!metricId)
    return res
      .status(400)
      .json({ message: "MetricId is required for this function" });

  try {
    const settings = await MetricSettings.findAll({
      where: { metricId: metricId },
    });
    if (!settings)
      return res.status(400).json({ message: "Settings for Metric not found" });

    res.status(200).json({ settings });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getMetricSettingsById = async (req, res) => {
  const { metricId, id } = req.params;

  // Validate params
  if (!metricId || !id)
    return res
      .status(400)
      .json({ message: "MetricId is required for this function" });

  try {
    const settings = await MetricSettings.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!settings)
      return res.status(400).json({ message: "Settings for Metric not found" });

    res.status(200).json({ settings });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateMetricSettings = async (req, res) => {
  const { metricId, id } = req.params;
  const { isTracked, goalValue, versionDate } = req.body;

  // Validate params
  if (!metricId || !id)
    return res.status(400).json({
      message: "MetricId or SettingsId is required for this function",
    });

  try {
    const settings = await MetricSettings.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!settings)
      return res.status(400).json({ message: "Settings for Metric not found" });

    await settings.update({ isTracked, goalValue, versionDate });

    res
      .status(200)
      .json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.deleteMetricSettings = async (req, res) => {
  const { metricId, id } = req.params;

  // Validate params
  if (!metricId || !id)
    return res.status(400).json({
      message: "MetricId or SettingsId is required for this function",
    });

  try {
    const settings = await MetricSettings.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!settings)
      return res.status(400).json({ message: "Settings for Metric not found" });

    await settings.destroy();

    res
      .status(200)
      .json({ message: "Settings deleted successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
