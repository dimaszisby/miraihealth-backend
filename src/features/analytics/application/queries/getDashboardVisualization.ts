import { QueryTypes } from "sequelize";
import { sequelize } from "@/models";
import {
  resolveBucket,
  type BucketAlias,
  type BucketSpec,
} from "../../domain/buckets";
import type { FillMode } from "../../domain/types";
import AppError from "@/utils/AppError";
import {
  vizDashKey,
  getCachedViz,
  setCachedViz,
} from "../../infrastructure/cache/vizCache";
import { buildDashboardSQL } from "../../infrastructure/sql/visualization.dashboard.sql";

// Handling queries for logs for a multiple metric
// used for data visualizations in Dashbboard Page

const DASH_MAX_BUCKETS = Number(process.env.VIZ_MAX_BUCKETS ?? 400);
const DASH_MAX_METRICS = Number(process.env.VIZ_DASH_MAX_METRICS ?? 24);

export async function getDashboardVisualization(input: {
  userId: string;
  startISO: string;
  endISO: string;
  bucket: BucketAlias;
  tz: string;
  fill?: FillMode;
  limit?: number;
}) {
  const spec = resolveBucket(input.bucket);
  const limit = Math.min(input.limit ?? 12, DASH_MAX_METRICS);

  // same range guard you use today
  assertBounds(input.startISO, input.endISO, spec, DASH_MAX_BUCKETS);

  // Select the metrics that appear on dashboard, ordered by priority
  const metrics = await sequelize.query<{
    metric_id: string;
    name: string;
    unit: string;
    category_name: string | null;
    category_icon: string | null;
    category_color: string | null;
    priority: number | null;
  }>(
    // Working Query
    //     `
    //     SELECT ms.metric_id,
    //            m.name AS name,
    //            m.default_unit AS unit,
    //            COALESCE((ms.display_options->>'priority')::int, NULL) AS priority
    //     FROM metric_settings ms
    //     JOIN metrics m ON m.id = ms.metric_id
    //     WHERE m.user_id = :userId
    //       AND COALESCE((ms.display_options->>'showOnDashboard')::boolean, false) = true
    //       AND COALESCE(ms.is_active, true) = true
    //     ORDER BY priority NULLS LAST, ms.created_at DESC
    //     LIMIT :limit
    //   `,

    // Current Experiment, Problem Here
    `
    SELECT ms.metric_id,
           m.name AS name,
           m.default_unit AS unit,
            c.name as category_name,
            c.color as category_color,
            c.icon as category_icon,
           COALESCE((ms.display_options->>'priority')::int, NULL) AS priority
    FROM metric_settings ms
    JOIN metrics m ON m.id = ms.metric_id
    LEFT JOIN metric_categories c ON m.category_id = c.id
    WHERE m.user_id = :userId
      AND COALESCE((ms.display_options->>'showOnDashboard')::boolean, false) = true
      AND COALESCE(ms.is_active, true) = true
    ORDER BY priority NULLS LAST, ms.created_at DESC
    LIMIT :limit
  `,
    {
      type: QueryTypes.SELECT,
      replacements: { userId: input.userId, limit },
    }
  );

  if (!metrics.length) {
    return {
      items: [],
      meta: {
        bucket: input.bucket,
        tz: input.tz,
        range: { startISO: input.startISO, endISO: input.endISO },
        count: 0,
      },
    };
  }

  // Cache key based on the *set* of metricIds + params
  const metricIds = metrics.map((m) => m.metric_id).sort();
  const cacheK = vizDashKey({
    userId: input.userId,
    metricIds,
    startISO: input.startISO,
    endISO: input.endISO,
    bucketIso: spec.iso,
    tz: input.tz,
    fill: input.fill ?? "none",
  });
  const cached = await getCachedViz<typeof result>(cacheK);
  if (cached) return cached;

  type Row = {
    metric_id: string;
    bucket_start: string;
    avg_value: number | null;
    min_value: number | null;
    max_value: number | null;
    cnt: number | null;
  };

  const rows = await sequelize.query<Row>(buildDashboardSQL(spec), {
    type: QueryTypes.SELECT,
    bind: {
      tz: input.tz,
      start: input.startISO,
      end: input.endISO,
      metricIds, // array binding
    },
  });

  // group rows by metric
  const byMetric = new Map<string, Row[]>();
  for (const r of rows) {
    if (!byMetric.has(r.metric_id)) byMetric.set(r.metric_id, []);
    byMetric.get(r.metric_id)!.push(r);
  }

  const items = metrics.map(
    ({
      metric_id,
      name,
      unit,
      category_name,
      category_color,
      category_icon,
      priority,
    }) => {
      const seriesRows = byMetric.get(metric_id) ?? [];

      const series = seriesRows.map((r) => ({
        bucketStartISO: new Date(r.bucket_start).toISOString(),
        value:
          input.fill === "zero" ? (r.avg_value ?? 0) : (r.avg_value ?? null),
      }));

      const nums = (xs: (number | null)[]) =>
        xs
          .map((n) => (n == null ? null : Number(n)))
          .filter(
            (n): n is number => typeof n === "number" && !Number.isNaN(n)
          );

      const avgs = nums(seriesRows.map((r) => r.avg_value));
      const mins = nums(seriesRows.map((r) => r.min_value));
      const maxs = nums(seriesRows.map((r) => r.max_value));

      const count = seriesRows.reduce(
        (acc, r) => acc + (Number(r.cnt) || 0),
        0
      );

      return {
        metricId: metric_id,
        name,
        unit,
        category_name,
        category_color,
        category_icon,
        priority,
        series,
        stats: {
          average: avgs.length
            ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(6))
            : null,
          min: mins.length ? Math.min(...mins) : null,
          max: maxs.length ? Math.max(...maxs) : null,
          count,
        },
      };
    }
  );

  const result = {
    items,
    meta: {
      bucket: input.bucket,
      tz: input.tz,
      range: { startISO: input.startISO, endISO: input.endISO },
      count: items.length,
    },
  };

  await setCachedViz(cacheK, result);
  return result;
}

// local specific helper
function assertBounds(
  startISO: string,
  endISO: string,
  spec: BucketSpec,
  max: number
) {
  const s = Date.parse(startISO),
    e = Date.parse(endISO);
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s)
    throw new AppError("Invalid date range", 400);
  const est = Math.ceil((e - s) / spec.approxMs) + 2;
  if (est > max)
    throw new AppError(
      `Range too large for ${spec.iso} (~${est} buckets, max=${max})`,
      400
    );
}
