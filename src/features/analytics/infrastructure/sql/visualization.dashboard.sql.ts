import type { BucketSpec } from "../../domain/buckets";

// Query for logs in a multiple metrics
// used for data visualizations in Dasboard Page

export function buildDashboardSQL(spec: BucketSpec) {
  return `
    WITH bounds AS (
      SELECT timezone($tz, $start::timestamptz) AS start_tz,
             timezone($tz, $end::timestamptz)   AS end_tz
    ),
    series AS (
      SELECT generate_series(
        date_trunc('${spec.trunc}', (SELECT start_tz FROM bounds)),
        (SELECT end_tz FROM bounds) - interval '1 second',
        interval '${spec.interval}'
      ) AS bucket_start
    ),
    covered_metrics AS (
      SELECT unnest($metricIds::uuid[]) AS metric_id
    ),
    logs AS (
      SELECT ml.metric_id,
             timezone($tz, ml.logged_at) AS ts_tz,
             ml.log_value
      FROM metric_logs ml
      JOIN covered_metrics cm ON cm.metric_id = ml.metric_id
      WHERE ml.logged_at >= $start::timestamptz
        AND ml.logged_at <  $end::timestamptz
    ),
    binned AS (
      SELECT l.metric_id,
             date_trunc('${spec.trunc}', l.ts_tz) AS bucket_start,
             avg(l.log_value) AS avg_value,
             min(l.log_value) AS min_value,
             max(l.log_value) AS max_value,
             count(*)::int         AS cnt
      FROM logs l
      GROUP BY 1,2
    )
    SELECT cm.metric_id,
           s.bucket_start,
           b.avg_value, b.min_value, b.max_value, b.cnt
    FROM covered_metrics cm
    CROSS JOIN series s
    LEFT JOIN binned b
      ON b.metric_id = cm.metric_id AND b.bucket_start = s.bucket_start
    ORDER BY cm.metric_id, s.bucket_start;
  `;
}
