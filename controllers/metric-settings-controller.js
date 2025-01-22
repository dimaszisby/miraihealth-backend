const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("util");
const { Metric, MetricSettings } = require("../models");
const { successResponse } = require("../utils/response-formatter");

exports.createMetricSettings = async (req, res, next) => {
  const metricId = req.params.metricId;
  const { isTracked, goalValue, versionDate } = req.body;

  console.log(`Received request to create Settings for metricId: ${metricId}`);
  console.log(`Request Body:`, req.body);

  if (!metricId) {
    throw new AppError(
      "Required Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  if (!isTracked || !goalValue) {
    throw new AppError("Required body is missing, cancelling operations", 400);
  }

  try {
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
  } catch (error) {
    next(error);
  }
};

exports.getAllMetricSettings = async (req, res, next) => {
  const metricId = req.params.metricId;

  if (!metricId) {
    throw new AppError(
      "Required MetricId param is empty, cancelling operations",
      400
    );
  }

  try {
    const settings = await MetricSettings.findAll({
      where: { metricId: metricId },
    });
    if (!settings) {
      throw new AppError("Settings for Metric not found", 404);
    }

    successResponse(res, 200, { settings });
  } catch (error) {
    next(error);
  }
};

exports.getMetricSettingsById = async (req, res, next) => {
  const { metricId, id } = req.params;

  if (!metricId || !id) {
    throw new AppError(
      "Required MetricId or Settings Id param is empty, cancelling operations",
      400
    );
  }

  try {
    const settings = await MetricSettings.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!settings) {
      throw new AppError("Settings for Metric not found", 404);
    }

    successResponse(res, 200, { settings });
  } catch (error) {
    next(error);
  }
};

exports.updateMetricSettings = async (req, res, next) => {
  const { metricId, id } = req.params;
  const { isTracked, goalValue, versionDate } = req.body;

  if (!metricId || !id) {
    throw new AppError(
      "Required MetricId or Settings Id param is empty, cancelling operations",
      400
    );
  }

  try {
    const settings = await MetricSettings.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!settings) {
      throw new AppError("Settings for Metric not found", 404);
    }

    await settings.update({ isTracked, goalValue, versionDate });

    successResponse(res, 200, { settings }, "Settings updated successfully");
  } catch (error) {
    next(error);
  }
};

exports.deleteMetricSettings = async (req, res, next) => {
  const { metricId, id } = req.params;

  if (!metricId || !id) {
    throw new AppError(
      "Required MetricId or Settings Id param is empty, cancelling operations",
      400
    );
  }

  try {
    const settings = await MetricSettings.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!settings) {
      throw new AppError("Settings for Metric not found", 404);
    }

    await settings.destroy();

    successResponse(res, 200, { settings }, "Settings deleted successfully");
  } catch (error) {
    next(error);
  }
};
