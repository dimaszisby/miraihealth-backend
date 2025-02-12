const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("util");
const { Metric, MetricSettings } = require("../models");
const { successResponse } = require("../utils/response-formatter");
const catchAsync = require("../utils/catch-async");

// Create a Settings for a Metric
exports.createMetricSettings = catchAsync(async (req, res, next) => {
  const metricId = req.params.metricId;

  const {
    goalEnabled,
    goalType,
    goalValue,
    timeFrameEnabled,
    startDate,
    deadlineDate,
    alertsEnabled,
    alertThresholds,
    displayOptions,
  } = req.body;

  console.log(`Received request to create Settings for metricId: ${metricId}`);
  console.log(`Request Body:`, req.body);

  // Validate that the parent Metric exists
  const metric = await Metric.findOne({
    where: { id: metricId },
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }

  const metricSettings = await MetricSettings.create({
    metricId,
    goalEnabled,
    goalType,
    goalValue,
    timeFrameEnabled,
    startDate,
    deadlineDate,
    alertsEnabled,
    alertThresholds,
    displayOptions,
  });

  successResponse(
    res,
    201,
    { metricSettings },
    "Metric Settings created successfully"
  );
});

// Get All Settings for a Metric
exports.getAllMetricSettings = catchAsync(async (req, res, next) => {
  const metricId = req.params.metricId;

  const settings = await MetricSettings.findAll({
    where: { metricId: metricId },
  });

  if (!settings || settings.length === 0) {
    throw new AppError("Settings for Metric not found", 404);
  }

  successResponse(
    res,
    200,
    { settings },
    "Metric Settings retrieved successfully"
  );
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

  successResponse(
    res,
    200,
    { settings },
    "Metric Settings retrieved successfully"
  );
});

// Update a Setting for a Metric
exports.updateMetricSettings = catchAsync(async (req, res, next) => {
  const { metricId, id } = req.params;
  const updates = req.body;

  const metricSettings = await MetricSettings.findOne({
    where: { id: id, metricId: metricId },
  });
  if (!metricSettings) throw new AppError("Metric settings not found.", 404);

  await metricSettings.update(updates);

  successResponse(
    res,
    200,
    metricSettings,
    "Metric settings updated successfully."
  );
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
