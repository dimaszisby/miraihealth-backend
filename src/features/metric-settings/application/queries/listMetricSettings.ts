import { models } from "@/models";
import { MetricSettingsResponseDTO } from "@/types/dtos/metric-settings.dto";
import AppError from "@/utils/AppError";
import { toDomainMetricSettings } from "@/utils/mappers/metric-settings.mapper";
import { WhereOptions, Op, OrderItem } from "sequelize";
import logger from "@/utils/logger";

// * Sorting
export type SortField = "createdAt" | "updatedAt" | "isActive";
export type SortParam = SortField | `-${SortField}`;
type Dir = "ASC" | "DESC";

// TODO: Generics
export interface ListSettingsResult {
  items: MetricSettingsResponseDTO[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: { metricId?: string; isActive?: boolean };
  totalCount?: number;
}

// TODO: Generics/Shared
export interface ListOpts {
  userId: string;
  limit: number;
  sort: SortParam;
  q?: string;
  filter?: { metricId?: string; isActive?: boolean };
  after?: string; // base64url
  includeTotal?: boolean;
}

// ===== Cursor payloads per field =====
// local
type CursorPayload = {
  sort: SortParam;
  id: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  metricId?: string;
  includeTotal?: boolean;
};

// TODO: Shared
function encodeCursor(c: CursorPayload): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}
// TODO: Shared
function decodeCursor(s: string): CursorPayload | null {
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// TODO: Generics
function normalizeSort(sort: SortParam): {
  field: SortField;
  dir: Dir;
} {
  const s = sort ?? "-createdAt";
  const dir: Dir = s.startsWith("-") ? "DESC" : "ASC";
  const field = (s.startsWith("-") ? s.slice(1) : s) as SortField;

  return ["createdAt", "updatedAt", "isActive"].includes(field)
    ? { field, dir }
    : { field: "createdAt", dir: "DESC" };
}

// ===== Cursor payloads per field =====
function buildWhere(
  filter?: { metricId?: string; isActive?: boolean },
  q?: string // Keeping q for potential future generic search, but not used for now
): WhereOptions {
  const and: any[] = [];
  if (filter?.metricId) and.push({ metricId: filter.metricId });
  if (filter?.isActive !== undefined) and.push({ isActive: filter.isActive });
  // If 'q' needs to search across multiple string fields, implement here.
  // For now, 'q' is not directly used in buildWhere for MetricSettings.
  return and.length ? { [Op.and]: and } : {};
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
    case "isActive": {
      const last = cursor.isActive!;
      return {
        [Op.or]: [
          { isActive: { [ltgt]: last } },
          {
            [Op.and]: [
              { isActive: { [eq]: last } },
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
    case "isActive":
      return [
        ["isActive", dir],
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

function baseIncludeForOwnership(userId: string) {
  return [
    {
      model: models.Metric,
      as: "metric",
      attributes: [], // we don't need columns; join only
      required: true,
      where: { userId, deletedAt: null },
    },
  ];
}

export async function listSettingsViaCursor({
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

  const include = baseIncludeForOwnership(userId);
  // This where is for METRIC SETTINGS (has userId, deletedAt)
  const baseWhere = buildWhere(filter, q);
  if (filter?.metricId) {
    logger.debug("[settings:list] filtering by metricId", {
      metricId: filter.metricId,
      userId,
    });
  }

  // total settings for pagination option
  const totalCount = includeTotal
    ? await models.MetricSettings.count({ where: baseWhere, include })
    : undefined;

  // apply cursor window on top of baseWhere
  let where: any = { ...baseWhere };
  if (after) {
    const c = decodeCursor(after);
    if (c && c.sort === sort) {
      where = { [Op.and]: [baseWhere, buildCursorPredicate(c, field, dir)] };
    }
  }

  // order
  const order = buildOrder(field, dir);

  // SELECT
  const rows = await models.MetricSettings.findAll({
    where,
    include,
    limit: pageSize + 1,
    order,
    raw: true,
    nest: true,
  });

  // map + trim extra
  const hasMore = rows.length > pageSize;
  const itemsRaw = hasMore ? rows.slice(0, pageSize) : rows;
  const items = itemsRaw.map(toDomainMetricSettings);

  // compute nextCursor from the **last** item actually returned
  let nextCursor: string | undefined;
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    // Compose field-specific cursor payload
    const payload: CursorPayload = { sort, id: last.id };
    if (field === "createdAt") payload.createdAt = last.createdAt.toISOString();
    else if (field === "updatedAt")
      payload.updatedAt = last.updatedAt.toISOString();
    else if (field === "isActive") payload.isActive = last.isActive;
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
