import { models } from "@/models";
import { MetricLibraryDomain } from "@/types/domain/metric.domain";
import AppError from "@/utils/AppError";
import { toDomainMetricLibrary } from "@/utils/mappers/metric.mapper";
import {
  FindAttributeOptions,
  ProjectionAlias,
  Sequelize,
  WhereOptions,
  Op,
  OrderItem,
} from "sequelize";

// ===== Sorting model =====
export type SortField = "createdAt" | "updatedAt" | "name" | "logCount";

// TODO: Shared
type SortParam = SortField | `-${SortField}`;
type Dir = "ASC" | "DESC";

// TODO: Generics
export interface ListMetricCategoriesResult {
  items: MetricLibraryDomain[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: { name?: string; categoryId?: string }; // WIP
  totalCount?: number;
}
// TODO: Generics/Shared
export interface ListOpts {
  userId: string;
  limit: number;
  sort: SortParam; // now allows createdAt|updatedAt|name|metricCount (+/-)
  q?: string;
  filter?: { name?: string; categoryId?: string }; // WIP
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
  nameLower?: string;
  logCount?: number;
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

const LOG_COUNT_SQL =
  `(SELECT COUNT(*) FROM "public"."metric_logs" ml ` +
  `WHERE ml."metric_id" = "Metric"."id")`;
// TS-safe helper
function baseAttributesWithLogCount(): (string | ProjectionAlias)[] {
  const logCount: ProjectionAlias = [
    Sequelize.literal(LOG_COUNT_SQL),
    "logCount",
  ];
  return [
    "id",
    "createdAt",
    "updatedAt",
    "defaultUnit",
    "description",
    "name",
    "userId",
    "categoryId",
    "deletedAt",
    "isPublic",
    logCount,
  ];
}

// TODO: Generics
function normalizeSort(sort: SortParam): {
  field: SortField;
  dir: Dir;
} {
  const s = sort ?? "-createdAt";
  const dir: Dir = s.startsWith("-") ? "DESC" : "ASC";
  const field = (s.startsWith("-") ? s.slice(1) : s) as SortField;

  return ["createdAt", "updatedAt", "name", "logCount"].includes(field)
    ? { field, dir }
    : { field: "createdAt", dir: "DESC" };
}

// ===== Cursor payloads per field =====
// TODO: Shared/generics
function buildWhere(
  userId: string,
  q?: string,
  filter?: { name?: string; categoryId?: string }
): WhereOptions {
  const like = (v: string) => ({ [Op.iLike]: `%${v}%` });
  const and: any[] = [{ userId }, { deletedAt: null }];

  if (q) and.push({ name: like(q) });
  if (filter?.name) and.push({ name: like(filter.name) });
  if (filter?.categoryId) and.push({ categoryId: filter.categoryId }); // WIP

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
    case "logCount": {
      const last = cursor.logCount!;
      const scalar = Sequelize.literal(LOG_COUNT_SQL);
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
    case "logCount":
      return [
        [Sequelize.literal(LOG_COUNT_SQL), dir],
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

export async function listMetricsViaCursor({
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

  // This where is for METRICS (has userId, deletedAt)
  const baseWhere = buildWhere(userId, q, filter);

  // total Mertics
  const totalCount = includeTotal
    ? await models.Metric.count({ where: baseWhere })
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
  const rows = await models.Metric.findAll({
    where,
    limit: pageSize + 1, // fetch one extra to decide nextCursor
    order,
    attributes: baseAttributesWithLogCount(),
    include: [
      {
        model: models.MetricCategory,
        as: "category",
        attributes: ["id", "name", "icon", "color"],
      },
    ],
    raw: true,
    nest: true,
  });

  // map + trim extra
  const hasMore = rows.length > pageSize;
  const itemsRaw = hasMore ? rows.slice(0, pageSize) : rows;
  const items = itemsRaw.map(toDomainMetricLibrary);

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
    else if (field === "logCount")
      payload.logCount = Number((last as any).logCount ?? 0);
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
