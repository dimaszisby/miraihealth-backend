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
import {
  buildDashboardLifecycleSQL,
  buildDashboardSQL,
} from "../../infrastructure/sql/visualization.dashboard.sql";
import {
  computeFallbackRange,
  type RangeDescriptor,
} from "../../domain/fallback-range";
import logger from "@/utils/logger";
import { createHash } from "node:crypto";

// Handling queries for logs for a multiple metric
// used for data visualizations in Dashbboard Page

const DASH_MAX_BUCKETS = Number(process.env.VIZ_MAX_BUCKETS ?? 400);
const DASH_MAX_METRICS = Number(process.env.VIZ_DASH_MAX_METRICS ?? 24);

type DashboardSeriesPoint = {
  bucketStartISO: string;
  value: number | null;
};

type DashboardVizItem = {
  metricId: string;
  name: string;
  unit: string;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  priority: number | null;
  series: DashboardSeriesPoint[];
  stats: {
    average: number | null;
    min: number | null;
    max: number | null;
    count: number;
  };
  lastLogAt: string | null;
  firstLogAt: string | null;
  totalLogs: number;
  latestValue: number | null;
  latestBucketStart: string | null;
  requestedRange: RangeDescriptor;
  actualRange: RangeDescriptor;
  fallbackRangeUsed: boolean;
  fallbackStrategy: string | null;
};

type DashboardVizResponse = {
  items: DashboardVizItem[];
  meta: {
    bucket: BucketAlias;
    tz: string;
    range: { startISO: string; endISO: string };
    count: number;
    totalMetrics: number;
    fallbackMetrics: number;
  };
  sync: {
    etagSeed: string;
  };
};

type SeriesRow = {
  metric_id: string;
  bucket_start: string;
  avg_value: number | string | null;
  min_value: number | string | null;
  max_value: number | string | null;
  cnt: number | string | null;
};

type LifecycleRow = {
  metric_id: string;
  first_log_at: string | null;
  last_log_at: string | null;
  total_logs: number | string | null;
  latest_value: number | string | null;
  latest_bucket_start: string | null;
};

export async function getDashboardVisualization(input: {
  userId: string;
  startISO: string;
  endISO: string;
  bucket: BucketAlias;
  tz: string;
  fill?: FillMode;
  limit?: number;
}): Promise<DashboardVizResponse> {
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
    total_count: number | string | null;
    metric_updated_at: string | null;
    metric_settings_updated_at: string | null;
    category_updated_at: string | null;
  }>(
    `
    SELECT ms.metric_id,
           m.name AS name,
           m.default_unit AS unit,
           c.name as category_name,
           c.color as category_color,
           c.icon as category_icon,
           COALESCE((ms.display_options->>'priority')::int, NULL) AS priority,
           COUNT(*) OVER () AS total_count,
           m.updated_at AS metric_updated_at,
           ms.updated_at AS metric_settings_updated_at,
           c.updated_at AS category_updated_at
    FROM metric_settings ms
    JOIN metrics m ON m.id = ms.metric_id
    LEFT JOIN metric_categories c ON m.category_id = c.id AND c.deleted_at IS NULL
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

  const totalMetrics =
    metrics.length > 0
      ? numberFrom(metrics[0].total_count, metrics.length)
      : 0;

  const baseRequestedRange: RangeDescriptor = {
    startISO: input.startISO,
    endISO: input.endISO,
    bucket: input.bucket,
  };

  // Cache key based on the *set* of metricIds + params (+ metadata version cursor)
  const metricIds = metrics.map((m) => m.metric_id).sort();
  const versionFingerprint = buildVersionFingerprint(metrics);
  const metricMetaById = new Map(
    metrics.map((m) => [m.metric_id, m] as const)
  );
  const cacheK = vizDashKey({
    userId: input.userId,
    metricIds,
    startISO: input.startISO,
    endISO: input.endISO,
    bucketIso: spec.iso,
    tz: input.tz,
    fill: input.fill ?? "none",
    versionCursor: versionFingerprint,
  });
  if (!metrics.length) {
    const emptyResult: DashboardVizResponse = {
      items: [],
      meta: {
        bucket: input.bucket,
        tz: input.tz,
        range: { startISO: input.startISO, endISO: input.endISO },
        count: 0,
        totalMetrics,
        fallbackMetrics: 0,
      },
      sync: {
        etagSeed: deriveEtagSeed(cacheK, versionFingerprint),
      },
    };
    return emptyResult;
  }
  const cached = await getCachedViz<DashboardVizResponse>(cacheK);
  if (cached) {
    const refreshed = {
      ...cached,
      items: cached.items.map((item) => {
        const meta = metricMetaById.get(item.metricId);
        if (!meta) return item;
        return {
          ...item,
          name: meta.name,
          unit: meta.unit,
          category_name: meta.category_name,
          category_color: meta.category_color,
          category_icon: meta.category_icon,
          priority: meta.priority,
        };
      }),
    };
    await setCachedViz(cacheK, refreshed);
    return refreshed;
  }

  const [seriesRows, lifecycleRows] = await Promise.all([
    fetchSeriesRows({
      metricIds,
      spec,
      tz: input.tz,
      startISO: input.startISO,
      endISO: input.endISO,
    }),
    sequelize.query<LifecycleRow>(buildDashboardLifecycleSQL(spec), {
      type: QueryTypes.SELECT,
      bind: { tz: input.tz, metricIds },
    }),
  ]);

  const lifecycleById = new Map<string, LifecycleRow>(
    lifecycleRows.map((row) => [row.metric_id, row])
  );

  // group rows by metric
  const byMetric = new Map<string, SeriesRow[]>();
  for (const r of seriesRows) {
    if (!byMetric.has(r.metric_id)) byMetric.set(r.metric_id, []);
    byMetric.get(r.metric_id)!.push(r);
  }

  const items: DashboardVizItem[] = await Promise.all(
    metrics.map(async (meta) => {
      const lifecycle = lifecycleById.get(meta.metric_id);
      let rowsForMetric = byMetric.get(meta.metric_id) ?? [];
      let actualRange: RangeDescriptor = { ...baseRequestedRange };
      let fallbackRangeUsed = false;
      let fallbackStrategy: string | null = null;

      const hasSamples = rowsForMetric.some((row) =>
        numberFrom(row.cnt, 0) > 0
      );

      if (!hasSamples && lifecycle?.last_log_at) {
        const fallback = computeFallbackRange({
          requested: baseRequestedRange,
          lastLogAt: lifecycle.last_log_at,
          guardBuckets: DASH_MAX_BUCKETS,
        });

        if (fallback) {
          const fallbackSeries = await fetchSeriesRows({
            metricIds: [meta.metric_id],
            spec: fallback.bucketSpec,
            tz: input.tz,
            startISO: fallback.range.startISO,
            endISO: fallback.range.endISO,
          });

          if (fallbackSeries.length) {
            rowsForMetric = fallbackSeries;
            actualRange = fallback.range;
            fallbackRangeUsed = true;
            fallbackStrategy = fallback.strategy;
            logger.info("analytics.dashboard.fallback_range_used", {
              metricId: meta.metric_id,
              userId: input.userId,
              requestedRange: baseRequestedRange,
              actualRange,
              fallbackStrategy,
            });
          }
        }
      }

      const series = rowsForMetric.map((r) => {
        const avgValue = numericValue(r.avg_value);
        return {
          bucketStartISO: toISO(r.bucket_start)!,
          value: avgValue ?? (input.fill === "zero" ? 0 : null),
        };
      });

      const extractNumbers = (xs: Array<number | string | null>) =>
        xs
          .map((value) => numericValue(value))
          .filter((value): value is number => value != null);

      const avgs = extractNumbers(rowsForMetric.map((r) => r.avg_value));
      const mins = extractNumbers(rowsForMetric.map((r) => r.min_value));
      const maxs = extractNumbers(rowsForMetric.map((r) => r.max_value));

      const count = rowsForMetric.reduce(
        (acc, r) => acc + numberFrom(r.cnt, 0),
        0
      );

      return {
        metricId: meta.metric_id,
        name: meta.name,
        unit: meta.unit,
        category_name: meta.category_name,
        category_color: meta.category_color,
        category_icon: meta.category_icon,
        priority: meta.priority,
        series,
        stats: {
          average: avgs.length
            ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(6))
            : null,
          min: mins.length ? Math.min(...mins) : null,
          max: maxs.length ? Math.max(...maxs) : null,
          count,
        },
        lastLogAt: toISO(lifecycle?.last_log_at ?? null),
        firstLogAt: toISO(lifecycle?.first_log_at ?? null),
        totalLogs: numberFrom(lifecycle?.total_logs, 0),
        latestValue: numericValue(lifecycle?.latest_value ?? null),
        latestBucketStart: toISO(lifecycle?.latest_bucket_start ?? null),
        requestedRange: { ...baseRequestedRange },
        actualRange,
        fallbackRangeUsed,
        fallbackStrategy,
      };
    })
  );

  const fallbackMetrics = items.filter((item) => item.fallbackRangeUsed).length;

  const result: DashboardVizResponse = {
    items,
    meta: {
      bucket: input.bucket,
      tz: input.tz,
      range: { startISO: input.startISO, endISO: input.endISO },
      count: items.length,
      totalMetrics,
      fallbackMetrics,
    },
    sync: {
      etagSeed: deriveEtagSeed(cacheK, versionFingerprint),
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

async function fetchSeriesRows(params: {
  metricIds: string[];
  tz: string;
  startISO: string;
  endISO: string;
  spec: BucketSpec;
}): Promise<SeriesRow[]> {
  if (!params.metricIds.length) return [];
  return sequelize.query<SeriesRow>(buildDashboardSQL(params.spec), {
    type: QueryTypes.SELECT,
    bind: {
      tz: params.tz,
      start: params.startISO,
      end: params.endISO,
      metricIds: params.metricIds,
    },
  });
}

function numberFrom(
  value: number | string | null | undefined,
  fallback = 0
): number {
  const numeric = numericValue(value);
  return numeric ?? fallback;
}

function numericValue(
  value: number | string | null | undefined
): number | null {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toISO(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildVersionFingerprint(
  metrics: Array<{
    metric_id: string;
    metric_updated_at: string | null;
    metric_settings_updated_at: string | null;
    category_updated_at: string | null;
  }>
) {
  if (!metrics.length) return "";
  return metrics
    .map((metric) =>
      [
        metric.metric_id,
        coerceTimestamp(metric.metric_updated_at),
        coerceTimestamp(metric.metric_settings_updated_at),
        coerceTimestamp(metric.category_updated_at),
      ].join(":")
    )
    .join("|");
}

function coerceTimestamp(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function deriveEtagSeed(cacheKey: string, fingerprint: string) {
  const raw = `${cacheKey}|${fingerprint}`;
  return createHash("sha1").update(raw).digest("hex");
}
