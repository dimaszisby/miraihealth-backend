import { QueryTypes } from "sequelize";
import { sequelize } from "@/models";
import { buildVisualizationSQL } from "../../infrastructure/sql/visualization.sql";
import type { FillMode, VizResponse } from "../../domain/types";
import AppError from "@/utils/AppError";
import {
  getCachedViz,
  setCachedViz,
  vizKey,
} from "../../infrastructure/cache/vizCache";
import { models } from "@/models";
import { BucketAlias, BucketSpec, resolveBucket } from "../../domain/buckets";

const MAX_BUCKETS = Number(process.env.VIZ_MAX_BUCKETS ?? 400);

function assertBounds(startISO: string, endISO: string, spec: BucketSpec) {
  const start = Date.parse(startISO);
  const end = Date.parse(endISO);

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new AppError("Invalid date range", 400);
  }

  // Fast pre-check; OK to be approximate for months/years
  const est = Math.ceil((end - start) / spec.approxMs) + 2;
  if (est > MAX_BUCKETS) {
    throw new AppError(
      `Range too large for ${spec.iso} (~${est} buckets, max=${MAX_BUCKETS})`,
      400
    );
  }
}

// TODO: Refactor to helper
async function assertOwnership(userId: string, metricId: string) {
  const metric = await models.Metric.findOne({
    where: { id: metricId, userId },
  });
  if (!metric) throw new AppError("Metric not found", 404);
  return metric;
}

export async function getVisualization(input: {
  userId: string;
  metricId: string;
  startISO: string;
  endISO: string;
  bucket: BucketAlias;
  tz: string;
  fill?: FillMode;
}): Promise<VizResponse> {
  const spec = resolveBucket(input.bucket);

  const {
    userId,
    metricId,
    startISO,
    endISO,
    bucket,
    tz,
    fill = "none",
  } = input;

  assertBounds(startISO, endISO, spec);
  const metric = await assertOwnership(userId, metricId);

  const cacheK = vizKey({
    userId: input.userId,
    metricId: input.metricId,
    startISO: input.startISO,
    endISO: input.endISO,
    bucketIso: spec.iso, // use canonical
    tz: input.tz,
    fill: input.fill ?? "none",
  });

  if (await getCachedViz<VizResponse>(cacheK))
    return (await getCachedViz<VizResponse>(cacheK))!;

  const cached = await getCachedViz<VizResponse>(cacheK);
  if (cached) return cached;

  type VizRow = {
    bucket_start: string;
    avg_value: number | null;
    min_value: number | null;
    max_value: number | null;
    cnt: number | null;
  };

  const sql = buildVisualizationSQL(spec);
  const rows = await sequelize.query<VizRow>(sql, {
    type: QueryTypes.SELECT,
    replacements: {
      metricId,
      start: input.startISO,
      end: input.endISO,
      tz,
    },
  });

  const series = rows.map((r: VizRow) => ({
    bucketStartISO: new Date(r.bucket_start).toISOString(),
    value: fill === "zero" ? (r.avg_value ?? 0) : (r.avg_value ?? null),
  }));

  const numeric = (x: number | null): x is number =>
    typeof x === "number" && !Number.isNaN(x);
  const allAvg = rows.map((r: VizRow) => r.avg_value).filter(numeric);
  const allMin = rows.map((r: VizRow) => r.min_value).filter(numeric);
  const allMax = rows.map((r: VizRow) => r.max_value).filter(numeric);
  const count = rows.reduce((acc: number, r: VizRow) => acc + (r.cnt ?? 0), 0);

  const stats = {
    average: allAvg.length
      ? Number(
          (
            allAvg.reduce((a: number, b: number) => a + b, 0) / allAvg.length
          ).toFixed(6)
        )
      : null,
    min: allMin.length ? Math.min(...allMin) : null,
    max: allMax.length ? Math.max(...allMax) : null,
    count,
  };

  const result: VizResponse = {
    series,
    stats,
    meta: {
      metricId,
      unit: metric.defaultUnit, // assumes model field alias
      bucket,
      tz,
      range: { startISO, endISO },
    },
  };

  await setCachedViz(cacheK, result);
  return result;
}
