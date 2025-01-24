const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { Metric } = require("../models");
const { getMetricData } = require("../services/metric-service");
const { successResponse } = require("../utils/response-formatter");
const catchAsync = require("../utils/catch-async");

// Create Metric
exports.createMetric = catchAsync(async (req, res, next) => {
  const { categoryId, originalMetricId, name, unit, version, isPublic } =
    req.body;
  const userId = req.user.id;

  const metric = await Metric.create({
    userId: userId,
    categoryId,
    originalMetricId,
    name,
    unit,
    version,
    isPublic,
  });

  successResponse(res, 201, { metric }, "Metric created successfully.");
});

// Get All Metrics owned by User
exports.getAllMetrics = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const metrics = await getMetricData(userId);
  successResponse(res, 200, { metrics });
});

// Get specific Metric by Id
exports.getMetricById = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  const metric = await Metric.findOne({
    where: { id: id, userId: userId },
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }

  successResponse(res, 200, { metric });
});

// Update Metric
exports.updateMetric = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { categoryId, originalMetricId, name, unit, version, isPublic } =
    req.body;

  const metric = await Metric.findOne({
    where: { id: id, userId: userId },
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }

  await metric.update({
    categoryId,
    originalMetricId,
    name,
    unit,
    version,
    isPublic,
  });

  successResponse(res, 200, { metric }, "Metric updated successfully");
});

// Delete Metric
exports.deleteMetric = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  const metric = await Metric.findOne({
    where: { id: id, userId: userId },
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }

  await metric.destroy();

  successResponse(res, 200, { metric }, "Metric deleted successfully");
});
