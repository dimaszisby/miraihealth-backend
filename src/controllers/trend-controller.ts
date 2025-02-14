import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import { MetricLog } from "../models/metric-log.js";
import { Metric } from "../models/metric.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catch-async.js";

/**
 * * Metric Trends Controller
 * Retrieves trend data for a specific metric.
 */

// Extend Express Request to include `user`
export interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * * Get Trend Data for a Specific Metric
 * @route GET /api/metrics/:metricId/trends
 */
export const getTrends = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId } = req.params;

    if (!metricId) {
      throw new AppError("Metric ID is required", 400);
    }

    // Validate if the user owns the metric
    const metric = await Metric.findOne({
      where: { id: metricId, userId: req.user?.id },
    });

    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    // Get logs for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await MetricLog.findAll({
      where: {
        metricId,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      order: [["createdAt", "ASC"]],
    });

    // Prepare trend data
    const trendData = logs.map((log) => ({
      date: log.createdAt,
      value: log.logValue, // ✅ Fixed incorrect property name (should be `logValue`)
    }));

    res.status(200).json(trendData);
  }
);
