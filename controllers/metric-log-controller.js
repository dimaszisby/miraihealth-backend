const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { MetricLog, Metric } = require("../models");
const { successResponse } = require("../utils/response-formatter");

exports.createMetricLog = async (req, res, next) => {
  const metricId = req.params.metricId;
  const { type, logValue } = req.body;

  console.log(
    `Received request to create MetricLog with metricId: ${metricId}`
  );
  console.log(`Request Body:`, req.body);

  if (!metricId) {
    throw new AppError(
      "Required Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  if (!logValue) {
    throw new AppError(
      "Required Log Value body is empty, cancelling operations",
      400
    );
  }

  try {
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
  } catch (error) {
    next(error);
  }
};

exports.getAllLogsByMetric = async (req, res, next) => {
  const metricId = req.params.metricId;

  if (!metricId) {
    throw new AppError(
      "Required Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  try {
    const logs = await MetricLog.findAll({
      where: { metricId: metricId },
    });

    successResponse(res, 200, { logs });
  } catch (error) {
    next(error);
  }
};

exports.getLogById = async (req, res, next) => {
  const { id, metricId } = req.params;

  if (!id || !metricId) {
    throw new AppError(
      "Required User Id or Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  try {
    const log = await MetricLog.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!log) {
      throw new AppError("Log not found", 404);
    }

    successResponse(res, 200, { log });
  } catch (error) {
    next(error);
  }
};

exports.updateLog = async (req, res, next) => {
  const { id, metricId } = req.params;
  const { logValue, type } = req.body;

  if (!id || !metricId) {
    throw new AppError(
      "Required User Id or Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  try {
    const log = await MetricLog.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!log) {
      throw new AppError("Log not found", 404);
    }

    await log.update({ logValue, type });

    successResponse(res, 200, { log }, "Log updated successfully");
  } catch (error) {
    next(error);
  }
};

exports.deletelog = async (req, res, next) => {
  const { id, metricId } = req.params;

  if (!id || !metricId) {
    throw new AppError(
      "Required User Id or Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  try {
    const log = await MetricLog.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!log) {
      throw new AppError("Log not found", 404);
    }

    await log.destroy();
    successResponse(res, 200, { log }, "Log deleted successfully");
  } catch (error) {
    next(error);
  }
};
