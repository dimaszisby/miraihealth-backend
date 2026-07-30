import {
  Op,
  OrderItem,
  Sequelize,
  WhereOptions,
  FindAttributeOptions,
  ProjectionAlias,
} from "sequelize";
import { models } from "@/infrastructure/db/models.js";
import { MetricCategoryRepository } from "../../../domain/repositories/MetricCategoryRepository.js";
import {
  ListQuery,
  ListResult,
  SortParam,
  SortField,
} from "../../../domain/types.js";
import { MetricCategory } from "../../../domain/entities/MetricCategory.js";
import {
  MetricCategoryRow,
  toDomain,
} from "../../mappers/MetricCategoryMapper.js";

const METRIC_COUNT_SQL =
  '(SELECT COUNT(*) FROM "metrics" m WHERE m."category_id" = "MetricCategory"."id" AND m."deleted_at" IS NULL)';

const baseAttrs = (): FindAttributeOptions => {
  const metricCount: ProjectionAlias = [
    Sequelize.literal(METRIC_COUNT_SQL),
    "metricCount",
  ];
  return { include: [metricCount] };
};

export class MetricCategoryRepoSequelize implements MetricCategoryRepository {
  async findById(userId: string, organizationId: string, id: string) {
    const row = (await models.MetricCategory.findOne({
      where: { id, userId, organizationId, deletedAt: null },
      attributes: baseAttrs(), // includes metricCount
      raw: true,
      nest: true,
    })) as MetricCategoryRow | null;

    return row ? toDomain(row) : null;
  }

  async existsByName(userId: string, organizationId: string, name: string) {
    const count = await models.MetricCategory.count({
      where: { userId, organizationId, name },
    });
    return count > 0;
  }

  async create(
    userId: string,
    organizationId: string,
    data: { name: string; color?: string; icon?: string },
  ) {
    const created = await models.MetricCategory.create({
      userId,
      organizationId,
      name: data.name,
      color: data.color ?? "#E897A3",
      icon: data.icon ?? "📁",
    });

    // reload as raw row with metricCount
    const fresh = (await models.MetricCategory.findByPk(created.id, {
      attributes: baseAttrs(),
      raw: true,
      nest: true,
    })) as MetricCategoryRow;

    // metricCount isn't on a new row; default to 0
    return toDomain({ ...fresh, metricCount: 0 });
  }

  async update(
    userId: string,
    organizationId: string,
    id: string,
    patch: Partial<{ name: string; color: string; icon: string }>,
  ) {
    const row = await models.MetricCategory.findOne({
      where: { id, userId, organizationId, deletedAt: null },
    });
    if (!row) throw new Error("Category not found");
    await row.update(patch);

    const fresh = (await models.MetricCategory.findByPk(id, {
      attributes: baseAttrs(),
      raw: true,
      nest: true,
    })) as MetricCategoryRow;

    return toDomain(fresh);
  }

  async delete(userId: string, organizationId: string, id: string) {
    await models.MetricCategory.destroy({
      where: { id, userId, organizationId },
    });
  }

  async list(q: ListQuery): Promise<ListResult<MetricCategory>> {
    const { field, dir } = normalizeSort(q.sort);
    const where = buildWhere(q.userId, q.organizationId, q.q, q.filter);
    const pageSize = Math.min(Math.max(q.limit || 20, 1), 100);

    const totalCount = q.includeTotal
      ? await models.MetricCategory.count({ where })
      : undefined;

    // cursor window
    let windowWhere: WhereOptions = where;
    if (q.after) {
      const c = decodeCursor(q.after);
      if (c && c.sort === q.sort)
        windowWhere = {
          [Op.and]: [where, buildCursorPredicate(c, field, dir)],
        };
    }

    const rows = (await models.MetricCategory.findAll({
      where: windowWhere,
      limit: pageSize + 1,
      order: buildOrder(field, dir),
      attributes: baseAttrs(),
      raw: true,
      nest: true,
    })) as MetricCategoryRow[];

    const hasMore = rows.length > pageSize;
    const items = (hasMore ? rows.slice(0, pageSize) : rows).map(toDomain);

    let nextCursor: string | undefined;
    if (hasMore && items.length) {
      const last = items[items.length - 1];
      const payload: CursorPayload = { sort: q.sort, id: last.id };
      if (field === "createdAt")
        payload.createdAt = last.createdAt.toISOString();
      else if (field === "updatedAt")
        payload.updatedAt = last.updatedAt.toISOString();
      else if (field === "name") payload.nameLower = last.name.toLowerCase();
      else payload.metricCount = last.metricCount;
      nextCursor = encodeCursor(payload);
    }

    return {
      items,
      nextCursor,
      sort: q.sort,
      limit: pageSize,
      ...(q.q && { q: q.q }),
      ...(q.filter && { filter: q.filter }),
      ...(q.includeTotal && { totalCount }),
    };
  }
}

/*** helpers copied from your current code and kept private here ***/
type Dir = "ASC" | "DESC";
type CursorPayload = {
  sort: SortParam;
  id: string;
  createdAt?: string;
  updatedAt?: string;
  nameLower?: string;
  metricCount?: number;
};
const encodeCursor = (c: CursorPayload) =>
  Buffer.from(JSON.stringify(c)).toString("base64url");
const decodeCursor = (s: string): CursorPayload | null => {
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

function normalizeSort(sort: SortParam): { field: SortField; dir: Dir } {
  const dir: Dir = sort.startsWith("-") ? "DESC" : "ASC";
  const field = (sort.startsWith("-") ? sort.slice(1) : sort) as SortField;
  return ["createdAt", "updatedAt", "name", "metricCount"].includes(field)
    ? { field, dir }
    : { field: "createdAt", dir: "DESC" };
}
function buildWhere(
  userId: string,
  organizationId: string,
  q?: string,
  filter?: { name?: string },
): WhereOptions {
  const like = (v: string) => ({ [Op.iLike]: `%${v}%` });
  const and: Array<Record<string, unknown>> = [
    { userId },
    { organizationId },
    { deletedAt: null },
  ];
  if (q) and.push({ name: like(q) });
  if (filter?.name) and.push({ name: like(filter.name) });
  return { [Op.and]: and };
}
function buildCursorPredicate(
  c: CursorPayload,
  field: SortField,
  dir: Dir,
): WhereOptions {
  const ltgt = dir === "DESC" ? Op.lt : Op.gt,
    eq = Op.eq;
  switch (field) {
    case "createdAt": {
      const C = new Date(c.createdAt!);
      return {
        [Op.or]: [
          { createdAt: { [ltgt]: C } },
          { [Op.and]: [{ createdAt: { [eq]: C } }, { id: { [ltgt]: c.id } }] },
        ],
      };
    }
    case "updatedAt": {
      const U = new Date(c.updatedAt!);
      return {
        [Op.or]: [
          { updatedAt: { [ltgt]: U } },
          { [Op.and]: [{ updatedAt: { [eq]: U } }, { id: { [ltgt]: c.id } }] },
        ],
      };
    }
    case "name": {
      const nameExpr = Sequelize.fn("LOWER", Sequelize.col("name"));
      const last = c.nameLower!;
      return {
        [Op.or]: [
          Sequelize.where(nameExpr, { [ltgt]: last }),
          {
            [Op.and]: [
              Sequelize.where(nameExpr, { [eq]: last }),
              { id: { [ltgt]: c.id } },
            ],
          },
        ],
      };
    }
    case "metricCount": {
      const last = c.metricCount!;
      const scalar = Sequelize.literal(METRIC_COUNT_SQL);
      return {
        [Op.or]: [
          Sequelize.where(scalar, { [ltgt]: last }),
          {
            [Op.and]: [
              Sequelize.where(scalar, { [eq]: last }),
              { id: { [ltgt]: c.id } },
            ],
          },
        ],
      };
    }
  }
}
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
    default:
      return [
        ["createdAt", dir],
        ["id", dir],
      ];
  }
}
