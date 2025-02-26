// src/utils/db-validators.ts

import db from "../models/index.js";
import AppError from "../utils/AppError.js";

const { Metric } = db;

/**
 * * Utility function to validate if a metric exists
 * @param metricId - The ID of the metric
 * @param userId - The ID of the user who owns the metric
 * @throws {AppError} If metric does not exist
 */
export const validateUserMetricExists = async (
  metricId: string,
  userId: string
) => {
  // Use a query that ensures the metric belongs to the user
  const metric = await Metric.findOne({
    where: { id: metricId, userId: userId },
    attributes: ["id", "userId"], // only fetch needed fields
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }
  return metric;
};

/**
 * * Utility function to validate if a metric exists and owned by the requesting user
 * @param userId - The ID of the user who owns the metric
 * @param metricId - The ID of the metric
 * @throws {AppError} If metric does not exist
 */
export const validateMetricAccess = async (
  userId: string,
  metricId: string
) => {
  // First, fetch the metric regardless of the userId.
  const metric = await Metric.findOne({
    where: { id: metricId },
    attributes: ["id", "userId", "isPublic"],
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }
  // Then, if the metric is not public and does not belong to the user, throw unauthorized.
  if (!metric.isPublic && metric.userId !== userId) {
    throw new AppError("Unauthorized access to metric stats", 403);
  }
  return metric;
};
