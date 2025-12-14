import { models } from "@/infrastructure/db/models";
import type { MetricLogDomain } from "@/types/domain/metric-log.domain";
import type {
  ListLogsResult,
  ListOpts,
  MetricLogQueryPort,
  SortField,
  SortParam,
} from "../../../application/ports/MetricLogQueryPort";
import { Op, OrderItem, WhereOptions } from "sequelize";

export class MetricLogQueryRepoSequelize implements MetricLogQueryPort {
  async listLogs(options: ListOpts): Promise<ListLogsResult> {
    const {
      userId,
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal = false,
    } = options;

    const { field, dir } = normalizeSort(sort);
    const pageSize = clampLimit(limit);
    const include = includeForOwnership(userId);
    const baseWhere = buildWhere(filter, q);

    const totalCount = includeTotal
      ? await models.MetricLog.count({ where: baseWhere, include })
      : undefined;

    let where: WhereOptions = { ...baseWhere };
    if (after) {
      const cursor = decodeCursor(after);
      if (cursor && cursor.sort === sort) {
        where = {
          [Op.and]: [baseWhere, buildCursorPredicate(cursor, field, dir)],
        };
      }
    }

    const rows = (await models.MetricLog.findAll({
      where,
      include,
      limit: pageSize + 1,
      order: buildOrder(field, dir),
      raw: true,
      nest: true,
    })) as RawLog[];

    const hasMore = rows.length > pageSize;
    const slice = hasMore ? rows.slice(0, pageSize) : rows;
    const domainItems = slice.map(toDomain);

    let nextCursor: string | undefined;
    if (hasMore && rows.length) {
      const last = rows[pageSize - 1];
      const payload: CursorPayload = { sort, id: last.id };
      if (field === "createdAt")
        payload.createdAt = new Date(last.createdAt).toISOString();
      else if (field === "updatedAt")
        payload.updatedAt = new Date(last.updatedAt).toISOString();
      else if (field === "loggedAt")
        payload.loggedAt = new Date(last.loggedAt).toISOString();
      else if (field === "logValue") payload.logValue = last.logValue;
      nextCursor = encodeCursor(payload);
    }

    return {
      items: domainItems,
      nextCursor,
      sort,
      limit: pageSize,
      ...(q ? { q } : {}),
      ...(filter ? { filter } : {}),
      ...(includeTotal ? { totalCount } : {}),
    };
  }
}

type CursorPayload = {
  sort: SortParam;
  id: string;
  createdAt?: string;
  updatedAt?: string;
  logValue?: number;
  loggedAt?: string;
};

type RawLog = {
  id: string;
  metricId: string;
  logValue: number;
  type: "manual" | "automatic";
  loggedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function clampLimit(limit: number) {
  return Math.min(Math.max(limit || 20, 1), 100);
}

function normalizeSort(sort: SortParam): { field: SortField; dir: Dir } {
  const defaultSort: SortParam = sort ?? "-createdAt";
  const dir: Dir = defaultSort.startsWith("-") ? "DESC" : "ASC";
  const field = (defaultSort.startsWith("-")
    ? defaultSort.slice(1)
    : defaultSort) as SortField;

  return ["createdAt", "updatedAt", "logValue", "loggedAt"].includes(field)
    ? { field, dir }
    : { field: "createdAt", dir: "DESC" };
}

function buildWhere(filter?: { logValue?: number; metricId?: string }, q?: string) {
  const and: any[] = [];
  if (filter?.metricId) and.push({ metricId: filter.metricId });
  if (filter?.logValue) and.push({ logValue: filter.logValue });
  if (q && q.trim()) {
    const numeric = Number(q);
    if (!Number.isNaN(numeric)) and.push({ logValue: { [Op.eq]: numeric } });
  }
  return and.length ? { [Op.and]: and } : {};
}

function buildCursorPredicate(
  cursor: CursorPayload,
  field: SortField,
  dir: Dir
): WhereOptions {
  const ltgt = dir === "DESC" ? Op.lt : Op.gt;
  const eq = Op.eq;

  switch (field) {
    case "createdAt": {
      const c = new Date(cursor.createdAt!);
      return {
        [Op.or]: [
          { createdAt: { [ltgt]: c } },
          {
            [Op.and]: [{ createdAt: { [eq]: c } }, { id: { [ltgt]: cursor.id } }],
          },
        ],
      };
    }
    case "updatedAt": {
      const u = new Date(cursor.updatedAt!);
      return {
        [Op.or]: [
          { updatedAt: { [ltgt]: u } },
          {
            [Op.and]: [{ updatedAt: { [eq]: u } }, { id: { [ltgt]: cursor.id } }],
          },
        ],
      };
    }
    case "logValue": {
      const last = cursor.logValue!;
      return {
        [Op.or]: [
          { logValue: { [ltgt]: last } },
          {
            [Op.and]: [{ logValue: { [eq]: last } }, { id: { [ltgt]: cursor.id } }],
          },
        ],
      };
    }
    case "loggedAt": {
      const l = new Date(cursor.loggedAt!);
      return {
        [Op.or]: [
          { loggedAt: { [ltgt]: l } },
          {
            [Op.and]: [{ loggedAt: { [eq]: l } }, { id: { [ltgt]: cursor.id } }],
          },
        ],
      };
    }
  }
}

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
    default:
      return [
        ["createdAt", dir],
        ["id", dir],
      ];
  }
}

function includeForOwnership(userId: string) {
  return [
    {
      model: models.Metric,
      as: "metric",
      attributes: [],
      required: true,
      where: { userId, deletedAt: null },
    },
  ];
}

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

const toDomain = (row: RawLog): MetricLogDomain => ({
  id: row.id,
  metricId: row.metricId,
  logValue: row.logValue,
  type: row.type,
  loggedAt: new Date(row.loggedAt),
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

type Dir = "ASC" | "DESC";
