const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { Metric } = require("../models");
const { getMetricData } = require("../services/metric-service");
const { successResponse } = require("../utils/response-formatter");

exports.createMetric = async (req, res, next) => {
  const userId = req.user.id;
  const { categoryId, originalMetricId, name, unit, version, isPublic } =
    req.body;

  if (!userId) {
    throw new AppError("Required User ID parameter is empty", 400);
  }

  if (!name || !unit) {
    throw new AppError(
      `Request body incomplete. Received - name: ${name}, unit: ${unit}`,
      400
    );
  }

  try {
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
  } catch (error) {
    next(error);
  }
};

exports.getAllMetrics = async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    throw new AppError(
      "Required User Id parameter is empty, cancelling operations",
      400
    );
  }

  try {
    const metrics = await getMetricData(userId);
    successResponse(res, 200, { metrics });
  } catch (error) {
    next(error);
  }
};

exports.getMetricById = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!userId) {
    throw new AppError(
      "Required User Id parameter is empty, cancelling operations",
      400
    );
  }

  if (!id) {
    throw new AppError(
      "Required Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  try {
    const metric = await Metric.findOne({
      where: { id: id, userId: userId },
    });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    successResponse(res, 200, { metric });
  } catch (error) {
    next(error);
  }
};

exports.updateMetric = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { categoryId, originalMetricId, name, unit, version, isPublic } =
    req.body;

  if (!userId) {
    throw new AppError(
      "Required User Id parameter is empty, cancelling operations",
      400
    );
  }

  if (!id) {
    throw new AppError(
      "Required Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  try {
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
  } catch (error) {
    next(error);
  }
};

exports.deleteMetric = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!userId) {
    throw new AppError(
      "Required User Id parameter is empty, cancelling operations",
      400
    );
  }

  if (!id) {
    throw new AppError(
      "Required Metric Id parameter is empty, cancelling operations",
      400
    );
  }

  try {
    const metric = await Metric.findOne({
      where: { id: id, userId: userId },
    });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    await metric.destroy();

    successResponse(res, 200, { metric }, "Metric deleted successfully");
  } catch (error) {
    next(error);
  }
};
