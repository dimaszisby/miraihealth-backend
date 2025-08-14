//src/features/metric-category/application/queries/ListCategories.ts

import { MetricCategoryDomain } from "@/features/metric-category/domain/entities/domain.js";
import AppError from "@/utils/AppError";
import { toDomainMetricCategories } from "@/features/metric-category/infrastructure/mapping/mapper.js";
import { FindAttributeOptions, Op, OrderItem, ProjectionAlias, Sequelize, WhereOptions } from "sequelize";

import { models } from "@/models";

// ===== Sorting model =====
export type SortField = "createdAt" | "updatedAt" | "name" | "metricCount";
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
const METRIC_COUNT_SQL =
  `(SELECT COUNT(*) FROM "metrics" m ` +
  `WHERE m."category_id" = "MetricCategory"."id" AND m."deleted_at" IS NULL)`;
// TS-safe helper
function baseAttributesWithMetricCount(): FindAttributeOptions {
  const metricCount: ProjectionAlias = [
    Sequelize.literal(METRIC_COUNT_SQL),
    "metricCount",
  ];
  return { include: [metricCount] };
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
    ? await models.MetricCategory.count({ where: baseWhere })
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
  const rows = await models.MetricCategory.findAll({
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

export default listMetricCategories;
