import { models } from "@/models";
import { MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";
import AppError from "@/utils/AppError";
import { toDomainMetricLog } from "@/utils/mappers/metric-log.mapper";
import { Sequelize, WhereOptions, Op, OrderItem } from "sequelize";

// * Sorting
export type SortField = "createdAt" | "updatedAt" | "logValue" | "loggedAt";
export type SortParam = SortField | `-${SortField}`;
type Dir = "ASC" | "DESC";

// TODO: Generics
export interface ListLogsResult {
  items: MetricLogResponseDTO[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: { name?: string; metricId?: string };
  totalCount?: number;
}

// TODO: Generics/Shared
export interface ListOpts {
  userId: string;
  limit: number;
  sort: SortParam; // now allows createdAt|updatedAt|name|metricCount (+/-)
  q?: string;
  filter?: { name?: string; metricId?: string }; // WIP
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
  logValue?: number;
  loggedAt?: string;
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

  return ["createdAt", "updatedAt", "logValue", "loggedAt"].includes(field)
    ? { field, dir }
    : { field: "createdAt", dir: "DESC" };
}

// ===== Cursor payloads per field =====
function buildWhere(
  filter?: { logValue?: number; metricId?: string },
  q?: string
): WhereOptions {
  const and: any[] = [];
  if (filter?.metricId) and.push({ metricId: filter.metricId });
  if (filter?.logValue) and.push({ logValue: filter.logValue });
  // optional: if you later want q to search value
  if (q && q.trim()) {
    const n = Number(q);
    if (!Number.isNaN(n)) and.push({ logValue: { [Op.eq]: n } });
  }
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
    case "logValue": {
      // Case-insensitive lexicographic compare using LOWER(logValue)
      const logValueExpr = Sequelize.fn("LOWER", Sequelize.col("logValue"));
      const last = cursor.logValue!;
      return {
        [Op.or]: [
          Sequelize.where(logValueExpr, { [ltgt]: last }),
          {
            [Op.and]: [
              Sequelize.where(logValueExpr, { [eq]: last }),
              { id: { [ltgt]: cursor.id } },
            ],
          },
        ],
      };
    }
    case "loggedAt": {
      const U = new Date(cursor.loggedAt!);
      return {
        [Op.or]: [
          { loggedAt: { [ltgt]: U } },
          {
            [Op.and]: [
              { loggedAt: { [eq]: U } },
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
    case "logValue":
      return [
        ["logValue", dir],
        ["id", dir],
      ];
    case "loggedAt":
      return [
        ["loggedAt", dir],
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

export async function listLogsViaCursor({
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
  // This where is for METRIC LOGS (has userId, deletedAt)
  const baseWhere = buildWhere(filter, q);

  // total logs for pagination option
  const totalCount = includeTotal
    ? await models.MetricLog.count({ where: baseWhere, include })
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

  // SELECT with metricCount (subquery) — same as your previous approach
  const rows = await models.MetricLog.findAll({
    where,
    limit: pageSize + 1, // fetch one extra to decide nextCursor
    order,
    raw: true,
    nest: true,
  });

  // map + trim extra
  const hasMore = rows.length > pageSize;
  const itemsRaw = hasMore ? rows.slice(0, pageSize) : rows;
  const items = itemsRaw.map(toDomainMetricLog);

  // compute nextCursor from the **last** item actually returned
  let nextCursor: string | undefined;
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    // Compose field-specific cursor payload
    const payload: CursorPayload = { sort, id: last.id };
    if (field === "createdAt") payload.createdAt = last.createdAt.toISOString();
    else if (field === "updatedAt")
      payload.updatedAt = last.updatedAt.toISOString();
    else if (field === "loggedAt")
      payload.loggedAt = last.loggedAt.toISOString();
    else if (field === "logValue") payload.logValue = last.logValue;
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
