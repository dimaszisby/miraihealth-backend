const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { MetricLog, Metric } = require("../models");
const { successResponse } = require("../utils/response-formatter");
const catchAsync = require("../utils/catch-async");

// Create a Log for a metric
exports.createMetricLog = catchAsync(async (req, res, next) => {
  const metricId = req.params.metricId;
  const { type, logValue } = req.body;

  console.log(
    `Received request to create MetricLog with metricId: ${metricId}`
  );
  console.log(`Request Body:`, req.body);

  // Verify that the parent Metric exists
  const metric = await Metric.findOne({ where: { id: metricId } });
  if (!metric) {
    throw new AppError("Parent Metric not found", 404);
  }

  const log = await MetricLog.create({
    metricId: metric.id,
    type,
    logValue,
  });

  successResponse(res, 201, { log }, "Metric Log created successfully");
});

// Get All Logs owned by a Metric
exports.getAllLogsByMetric = catchAsync(async (req, res, next) => {
  const metricId = req.params.metricId;

  const logs = await MetricLog.findAll({
    where: { metricId: metricId },
  });

  successResponse(res, 200, { logs });
});

// Get specific Log by Id
exports.getLogById = catchAsync(async (req, res, next) => {
  const { id, metricId } = req.params;

  const log = await MetricLog.findOne({
    where: { id: id, metricId: metricId },
  });
  if (!log) {
    throw new AppError("Log not found", 404);
  }

  successResponse(res, 200, { log });
});

// Update a Log
exports.updateLog = catchAsync(async (req, res, next) => {
  const { id, metricId } = req.params;
  const { logValue, type } = req.body;

  const log = await MetricLog.findOne({
    where: { id: id, metricId: metricId },
  });
  if (!log) {
    throw new AppError("Log not found", 404);
  }

  await log.update({ logValue, type });

  successResponse(res, 200, { log }, "Log updated successfully");
});

// Delete a Log
exports.deletelog = catchAsync(async (req, res, next) => {
  const { id, metricId } = req.params;

  const log = await MetricLog.findOne({
    where: { id: id, metricId: metricId },
  });
  if (!log) {
    throw new AppError("Log not found", 404);
  }

  await log.destroy();
  successResponse(res, 200, { log }, "Log deleted successfully");
});
