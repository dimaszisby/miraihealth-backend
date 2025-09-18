import { BucketSpec } from "../../domain/buckets";

export function buildVisualizationSQL(spec: BucketSpec) {
  // Uses :interval, :tz, :start, :end, :metricId
  // Aligns to bucket boundaries in the user's TZ.
  return `
    WITH bounds AS (
      SELECT
        timezone(:tz, :start::timestamptz) AS start_tz,
        timezone(:tz, :end::timestamptz)   AS end_tz
    ),
    series AS (
      SELECT generate_series(
        date_trunc('${spec.trunc}', (SELECT start_tz FROM bounds)),
        (SELECT end_tz FROM bounds) - interval '1 second',
        interval '${spec.interval}'
      ) AS bucket_start
    ),
    logs AS (
      SELECT
        timezone(:tz, ml.logged_at) AS ts_tz,
        ml.log_value
      FROM metric_logs ml
      WHERE ml.metric_id = :metricId
        AND ml.logged_at >= :start::timestamptz
        AND ml.logged_at <  :end::timestamptz
    ),
    binned AS (
      SELECT
        date_trunc('${spec.trunc}', ts_tz) AS bucket_start,
        avg(log_value) AS avg_value,
        min(log_value) AS min_value,
        max(log_value) AS max_value,
        count(*)       AS cnt
      FROM logs
      GROUP BY 1
    )
    SELECT
      s.bucket_start,
      b.avg_value, b.min_value, b.max_value, b.cnt
    FROM series s
    LEFT JOIN binned b
      ON b.bucket_start = s.bucket_start
    ORDER BY s.bucket_start ASC;
  `;
}
