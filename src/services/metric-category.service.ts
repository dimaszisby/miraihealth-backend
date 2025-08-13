// src/services/metric-category.service.ts

import db from "../models/index.js";
import { MetricCategoryDomain } from "@/types/domain/metric-category.domain";
import {
  CreateMetricCategoryRequestDTO,
  UpdateMetricCategoryRequestDTO,
} from "@/types/dtos/metric-category.dto";
import AppError from "@/utils/AppError";
import logger from "@/utils/logger";
import {
  redisClient,
  invalidateCache,
  invalidateCacheByPattern,
} from "@/utils/redis-client";
import { findOwnedCategory } from "@/utils/db-helper";
import {
  toDomainMetricCategories,
  toDomainMetricCategory,
} from "@/utils/mappers/metric-category.mapper";
import { Op, OrderItem, Sequelize, WhereOptions } from "sequelize";

const { MetricCategory, Metric } = db;

// ===== Sorting model =====
export type SortField = "createdAt" | "updatedAt" | "name" | "metricCount";
// export type SortParam =
//   | "createdAt"
//   | "-createdAt"
//   | "updatedAt"
//   | "-updatedAt"
//   | "name"
//   | "-name"
//   | "metricCount"
//   | "-metricCount";
export type SortParam = SortField | `-${SortField}`;
type Dir = "ASC" | "DESC";

function parseSort(sort: SortParam | undefined): {
  field: SortField;
  dir: Dir;
} {
  const s = sort ?? "-createdAt";
  const dir: Dir = s.startsWith("-") ? "DESC" : "ASC";
  const field = (s.startsWith("-") ? s.slice(1) : s) as SortField;
  // Safety fallback
  if (!["createdAt", "updatedAt", "name", "metricCount"].includes(field)) {
    return { field: "createdAt", dir: "DESC" };
  }
  return { field, dir };
}

export interface ListMetricCategoriesResult {
  items: MetricCategoryDomain[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: { name?: string };
  totalCount?: number;
}

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

export interface ListOpts {
  userId: string;
  limit: number;
  sort: SortParam; // now allows createdAt|updatedAt|name|metricCount (+/-)
  q?: string;
  filter?: { name?: string };
  after?: string; // base64url
  includeTotal?: boolean;
}

// ===== Cursor payloads per field =====
type CursorPayload = {
  sort: SortParam;
  id: string;
  createdAt?: string;
  updatedAt?: string;
  nameLower?: string;
  metricCount?: number;
};
function encodeCursor(c: CursorPayload): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}
function decodeCursor(s: string): CursorPayload | null {
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
// Scalar subquery reused for metricCount (excludes soft-deleted metrics)
const METRIC_COUNT_SQL = `(SELECT COUNT(*) FROM "metrics" m WHERE m."category_id" = "MetricCategory"."id" AND m."deleted_at" IS NULL)`;

function baseAttributesWithMetricCount() {
  return {
    include: [[Sequelize.literal(METRIC_COUNT_SQL), "metricCount"]],
  } as const;
}

function normalizeSort(sort: SortParam): {
  field: SortField;
  dir: Dir;
} {
  const s = sort ?? "-createdAt";
  const dir: Dir = s.startsWith("-") ? "DESC" : "ASC";
  const field = (s.startsWith("-") ? s.slice(1) : s) as SortField;

  return ["createdAt", "updatedAt", "name", "metricCount"].includes(field)
    ? { field, dir }
    : { field: "createdAt", dir: "DESC" };
}

// ===== Cursor payloads per field =====
function buildWhere(
  userId: string,
  q?: string,
  filter?: { name?: string }
): WhereOptions {
  const like = (v: string) => ({ [Op.iLike]: `%${v}%` });
  const and: any[] = [{ userId }, { deletedAt: null }];

  if (q) and.push({ name: like(q) });
  if (filter?.name) and.push({ name: like(filter.name) });
  return { [Op.and]: and };
}

/**
 * Build cursor condition for (createdAt, id) with direction
 * For DESC:  createdAt < C OR (createdAt = C AND id < I)
 * For ASC:   createdAt > C OR (createdAt = C AND id > I)
 */
function buildCursorPredicate(
  cursor: CursorPayload,
  field: SortField,
  dir: Dir
): WhereOptions {
  const ltgt = dir === "DESC" ? Op.lt : Op.gt;
  const eq = Op.eq;

  switch (field) {
    case "createdAt": {
      const C = new Date(cursor.createdAt!);
      return {
        [Op.or]: [
          { createdAt: { [ltgt]: C } },
          {
            [Op.and]: [
              { createdAt: { [eq]: C } },
              { id: { [ltgt]: cursor.id } },
            ],
          },
        ],
      };
    }
    case "updatedAt": {
      const U = new Date(cursor.updatedAt!);
      return {
        [Op.or]: [
          { updatedAt: { [ltgt]: U } },
          {
            [Op.and]: [
              { updatedAt: { [eq]: U } },
              { id: { [ltgt]: cursor.id } },
            ],
          },
        ],
      };
    }
    case "name": {
      // Case-insensitive lexicographic compare using LOWER(name)
      const nameExpr = Sequelize.fn("LOWER", Sequelize.col("name"));
      const last = cursor.nameLower!;
      return {
        [Op.or]: [
          Sequelize.where(nameExpr, { [ltgt]: last }),
          {
            [Op.and]: [
              Sequelize.where(nameExpr, { [eq]: last }),
              { id: { [ltgt]: cursor.id } },
            ],
          },
        ],
      };
    }
    case "metricCount": {
      const last = cursor.metricCount!;
      const scalar = Sequelize.literal(METRIC_COUNT_SQL);
      return {
        [Op.or]: [
          Sequelize.where(scalar, { [ltgt]: last }),
          {
            [Op.and]: [
              Sequelize.where(scalar, { [eq]: last }),
              { id: { [ltgt]: cursor.id } },
            ],
          },
        ],
      };
    }
  }
}

// ========== ORDER By builders ===========

function buildOrder(field: SortField, dir: Dir): OrderItem[] {
  switch (field) {
    case "name":
      return [
        [Sequelize.fn("LOWER", Sequelize.col("name")), dir],
        ["id", dir],
      ];
    case "metricCount":
      return [
        [Sequelize.literal(METRIC_COUNT_SQL), dir],
        ["id", dir],
      ];
    case "updatedAt":
      return [
        ["updatedAt", dir],
        ["id", dir],
      ];
    case "createdAt":
    default:
      return [
        ["createdAt", dir],
        ["id", dir],
      ];
  }
}

// * ========== Services ==========

/**
 * Create metric category for user
 * @param userId - ID of the user
 * @param data - Metric category data
 * @returns The created metric category
 */
export const createMetricCategoryService = async (
  userId: string,
  data: CreateMetricCategoryRequestDTO
): Promise<MetricCategoryDomain> => {
  if (!userId) throw new AppError("User not authenticated", 403);

  // Check for duplicate category name for the same user:
  const existingCategory = await MetricCategory.findOne({
    where: { userId: userId, name: data.name },
  });
  if (existingCategory) {
    throw new AppError("Category already exists", 400);
  }

  // Apply default values if optional fields are undefined
  const finalData = {
    ...data,
    color: data.color ?? "#E897A3",
    icon: data.icon ?? "📁",
    userId,
  };

  const category = await MetricCategory.create(finalData);

  // Invalidate only the categories list cache (not individual category cache)
  if (redisClient.isOpen) {
    invalidateAllMetricCategoryCache(userId, category.id);
  }

  return toDomainMetricCategory(category);
};

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

// * Via Cursor
// Question: This function does not have explicit return Type
export async function listMetricCategories({
  userId,
  limit,
  sort,
  q,
  filter,
  after,
  includeTotal = false,
}: ListOpts) {
  if (!userId) throw new AppError("User not authenticated", 403);

  // sanitize
  const { field, dir } = normalizeSort(sort);
  const pageSize = Math.min(Math.max(limit || 20, 1), 100);

  const baseWhere = buildWhere(userId, q, filter);

  // Question: Should I include total here?
  const totalCount = includeTotal
    ? await MetricCategory.count({ where: baseWhere })
    : undefined;

  // apply cursor window on top of baseWhere
  let where: any = { ...baseWhere };
  if (after) {
    const c = decodeCursor(after);
    if (c && c.sort === sort) {
      where = { [Op.and]: [baseWhere, buildCursorPredicate(c, field, dir)] };
    }
  }

  const order = buildOrder(field, dir);

  // SELECT with metricCount (subquery) — same as your previous approach
  const rows = await MetricCategory.findAll({
    where,
    limit: pageSize + 1, // fetch one extra to decide nextCursor
    order,
    attributes: baseAttributesWithMetricCount(),
    raw: true,
    nest: true,
  });

  // map + trim extra
  const hasMore = rows.length > pageSize;
  const itemsRaw = hasMore ? rows.slice(0, pageSize) : rows;
  const items = toDomainMetricCategories(itemsRaw);

  // compute nextCursor from the **last** item actually returned
  let nextCursor: string | undefined;
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    // Compose field-specific cursor payload
    const payload: CursorPayload = { sort, id: last.id };
    if (field === "createdAt") payload.createdAt = last.createdAt.toISOString();
    else if (field === "updatedAt")
      payload.updatedAt = last.updatedAt.toISOString();
    else if (field === "name") payload.nameLower = last.name.toLowerCase();
    else if (field === "metricCount")
      payload.metricCount = Number((last as any).metricCount ?? 0);
    nextCursor = encodeCursor(payload);
  }

  return {
    items,
    nextCursor,
    sort,
    limit: pageSize,
    ...(q ? { q } : {}), // optional
    ...(filter ? { filter } : {}), // optional
    ...(includeTotal ? { totalCount } : {}), // optional
  };
}

/**
 * Get a specific metric category by ID only can be accessed by owned user
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @returns Metric category object
 * @throws {AppError}  If category not found or on failure
 */
export const getUserMetricCategoryByIdService = async (
  userId: string,
  categoryId: string
): Promise<MetricCategoryDomain> => {
  const category = await findOwnedCategory(userId, categoryId);
  return toDomainMetricCategory(category);
};

/**
 * Update a metric category
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @param updateData - Updated data
 * @returns Updated metric category object
 */
export const updateMetricCategoryService = async (
  userId: string,
  categoryId: string,
  updateData: UpdateMetricCategoryRequestDTO
): Promise<MetricCategoryDomain> => {
  const category = await findOwnedCategory(userId, categoryId);
  await category.update(updateData);
  await category.reload();

  if (redisClient.isOpen && category.id) {
    invalidateAllMetricCategoryCache(userId, category.id);
  }

  return toDomainMetricCategory(category);
};

/**
 * Delete metric category
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @returns Deleted metric category object
 */
export const deleteMetricCategoryService = async (
  userId: string,
  categoryId: string
): Promise<MetricCategoryDomain> => {
  const category = await findOwnedCategory(userId, categoryId);

  if (redisClient.isOpen && category.id) {
    invalidateAllMetricCategoryCache(userId, category.id);
  }
  await category.destroy();

  return toDomainMetricCategory(category);
};

/**
 * * ===== Services for Testing Purposes =====
 */

/**
 * * Generate Dummy Metric Categories
 * Generates a specified number of dummy metric category entries for a given user.
 * @param userId - ID of the user
 * @param count - Number of dummy categories to generate
 * @returns Array of created metric category objects
 */
export const generateDummyCategoriesService = async (
  userId: string,
  count: number
): Promise<MetricCategoryDomain[]> => {
  const dummyCategories: MetricCategoryDomain[] = [];
  const colors = ["#FF6347", "#FFD700", "#ADFF2F", "#6495ED", "#DA70D6"]; // Example colors
  const icons = ["📚", "💡", "💪", "🌱", "🌟"]; // Example icons

  for (let i = 0; i < count; i++) {
    const name = `Dummy Category ${Date.now()}-${i}`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];

    const category = await MetricCategory.create({
      userId,
      name,
      color,
      icon,
    });
    dummyCategories.push(toDomainMetricCategory(category));
  }

  if (redisClient.isOpen) {
    await invalidateAllMetricCategoryCache(userId);

    logger.info(
      `♻️ Cache invalidated for categories:${userId} after dummy generation`
    );
  }

  return dummyCategories;
};

const createDateRangeFilter = (startDate?: Date, endDate?: Date) => {
  const dateRangeFilter: any = {};
  if (startDate) dateRangeFilter[Op.gte] = new Date(startDate);
  if (endDate) dateRangeFilter[Op.lte] = new Date(endDate);
  return dateRangeFilter;
};

/**
 * Invalidates all cache keys related to a user's category
 * including paginated, filtered, and sort
 * @param userId - The user ID.
 * @param metricId - The category ID.
 */
export async function invalidateAllMetricCategoryCache(
  userId: string,
  categoryId?: string
) {
  console.log(
    `♻️ [CACHE] Invalidating category for user=${userId}, category=${categoryId ?? "-"}"}`
  );

  // Invalidate "all category" list (user dashboard or similar)
  await invalidateCacheByPattern(`categories:${userId}:*`);

  if (categoryId) {
    // Invalidate all metric list queries for this category
    await invalidateCacheByPattern(`category:${userId}:${categoryId}`);
  }

  logger.info(
    `♻️ [CACHE] Cache invalidated for user:${userId}, and categor:${categoryId ?? "-"}`
  );
}
