// WAS: src/services/metric-category.service.ts

import db from "../../../../infrastructure/db/sequelize.js";
import { MetricCategoryDomain } from "@/features/metric-category/domain/entities/domain.js";
import {
  CreateMetricCategoryRequestDTO,
  UpdateMetricCategoryRequestDTO,
} from "@/features/metric-category/infrastructure/http/dto.js";
import AppError from "@/utils/AppError";
import logger from "@/utils/logger";
import {
  redisClient,
  invalidateCache,
  invalidateCacheByPattern,
} from "@/utils/redis-client";
import {
  toDomainMetricCategories,
  toDomainMetricCategory,
} from "@/features/metric-category/infrastructure/mapping/mapper.js";
import { Op, OrderItem, Sequelize, WhereOptions } from "sequelize";

const { MetricCategory, Metric } = db;

/**
 * @deprecated currently not being used, migrating to Cursor Method
 */
export interface CategoryQueryOptions {
  metricId?: string; // Make metricId optional for filtering
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// * ========== Services ==========

// TODO: when fetching metric category libraries, it will include how many metrics that is assigned to the category.
/**
 * Get all metric category owned by user only can be accessed by owned user
 * @param userId - ID of the user
 * @returns Array of metric category
 */

/**
 * Builds the query options for retrieving metric logs.
 *
 * @param metricId - ID of the metric.
 * @param options - Optional query options for filtering and sorting.
 * @returns An object containing the query options.
 */

const buildQueryOptions = (options?: CategoryQueryOptions): any => {
  const queryOptions: any = {
    where: {},
  };

  queryOptions.order = [
    [
      options?.sortBy || "createdAt",
      options?.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC",
    ],
  ];

  if (options?.limit) {
    queryOptions.limit = options.limit;
    queryOptions.offset = ((options.page || 1) - 1) * options.limit;
  }

  return queryOptions;
};

// * Via old school pagination
export const getPaginatedOwnedMetricCategoryService = async ({
  userId,
  options,
}: {
  userId: string;
  options: CategoryQueryOptions;
}): Promise<{ categories: MetricCategoryDomain[]; total: number }> => {
  if (!userId) throw new AppError("User not authenticated", 403);

  try {
    const queryOptions = buildQueryOptions(options);
    logger.info("[Query Query Options:", queryOptions);

    // First, get the total count of categories without pagination or grouping
    const totalCount = await MetricCategory.count({
      where: { userId },
    });

    // Then, fetch the paginated and grouped categories with metricCount
    const categories = await MetricCategory.findAll({
      ...queryOptions,
      where: { userId }, // Ensure categories are filtered by userId
      attributes: {
        include: [
          [
            Sequelize.literal(
              `(SELECT COUNT(*) FROM "metrics" WHERE "category_id" = "MetricCategory"."id")`
            ),
            "metricCount",
          ],
        ],
      },
      include: [
        {
          model: Metric,
          as: "Metric",
          attributes: [], // We only need the count, not the actual metric data
        },
      ],
      group: ["MetricCategory.id"], // Group by category ID to count metrics per category
      subQuery: false, // Important for correct pagination with grouped queries
      raw: true,
      nest: true,
    });

    console.log("categories is array?", Array.isArray(categories));
    console.log("categories sample:", categories[0]);

    return {
      categories: toDomainMetricCategories(categories),
      total: totalCount,
    };
  } catch (err) {
    // Log the entire error stack for debugging!
    console.error("🔥 FATAL: getAllUserMetricCategoryService error:", err);
    throw err; // Let your error handler wrap it
  }
};
