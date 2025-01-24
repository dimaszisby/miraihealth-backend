const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("util");
const { Metric, MetricSettings } = require("../models");
const { successResponse } = require("../utils/response-formatter");
const catchAsync = require("../utils/catch-async");

// Create a Settings for a Metric
exports.createMetricSettings = catchAsync(async (req, res, next) => {
  const metricId = req.params.metricId;
  const { isTracked, goalValue, versionDate } = req.body;

  console.log(`Received request to create Settings for metricId: ${metricId}`);
  console.log(`Request Body:`, req.body);

  // Validate Metric as a parent entity of Metic Settings
  const metric = await Metric.findOne({
    where: { id: metricId },
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }

  const settings = await MetricSettings.create({
    metricId: metric.id,
    isTracked,
    goalValue,
    versionDate,
  });
  if (!settings) {
    throw new AppError("Settings for Metric not found", 404);
  }

  successResponse(
    res,
    201,
    { settings },
    "Metric Settings created successfully"
  );
});

// Get All Settings for a Metric
exports.getAllMetricSettings = catchAsync(async (req, res, next) => {
  const metricId = req.params.metricId;

  const settings = await MetricSettings.findAll({
    where: { metricId: metricId },
  });
  if (!settings) {
    throw new AppError("Settings for Metric not found", 404);
  }

  successResponse(res, 200, { settings });
});

// Get a Specific Settings for a Metric
exports.getMetricSettingsById = catchAsync(async (req, res, next) => {
  const { metricId, id } = req.params;

  const settings = await MetricSettings.findOne({
    where: { id: id, metricId: metricId },
  });
  if (!settings) {
    throw new AppError("Settings for Metric not found", 404);
  }

  successResponse(res, 200, { settings });
});

// Update a Setting for a Metric
exports.updateMetricSettings = catchAsync(async (req, res, next) => {
  const { metricId, id } = req.params;
  const { isTracked, goalValue, versionDate } = req.body;

  const settings = await MetricSettings.findOne({
    where: { id: id, metricId: metricId },
  });
  if (!settings) {
    throw new AppError("Settings for Metric not found", 404);
  }

  await settings.update({ isTracked, goalValue, versionDate });

  successResponse(res, 200, { settings }, "Settings updated successfully");
});

// Delete a Settings for Metric
exports.deleteMetricSettings = catchAsync(async (req, res, next) => {
  const { metricId, id } = req.params;

  const settings = await MetricSettings.findOne({
    where: { id: id, metricId: metricId },
  });
  if (!settings) {
    throw new AppError("Settings for Metric not found", 404);
  }

  await settings.destroy();

  successResponse(res, 200, { settings }, "Settings deleted successfully");
});
