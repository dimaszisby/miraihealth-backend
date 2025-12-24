# Analytics Backend Overhaul Checklist

> **Created At:** 2025-12-01  
> **Updated At:** 2025-12-01  
> **Completed At:** Pending

## 1. Overview

Use this checklist to drive the backend implementation of the dashboard overhaul. Each section mirrors the phases in `analytics-backend-overhaul-plan.md` and should be reviewed during sprint planning and release readiness.

## 2. Alignment & Contract Prep

- [x] Confirm payload additions (`lastLogAt`, `firstLogAt`, `totalLogs`, `latestValue`, `latestBucketStart`, `actualRange`, `requestedRange`, `fallbackRangeUsed`, `fallbackStrategy`).
- [x] Produce shared sample response + OpenAPI snippet for `/analytics/dashboard` (`documents/features/analytics/dashboard-v2-sample-response.json`).
- [x] Agree on feature behind version flag or media type (optional query `v=2` documented in OpenAPI).
- [x] Finalize copy requirements for FE-empty states and document in UX brief (`documents/features/analytics/dashboard-empty-state-copy.md`).

## 3. Schema, SQL & Performance Foundations

- [x] Audit existing indices on `metric_logs` and document findings (`documents/features/analytics/metric-logs-index-audit.md`); retain `ix_metric_logs_metric_id_logged_at`.
- [x] Extend `visualization.dashboard.sql.ts` with lifecycle CTE (min/max timestamps, count, latest value).
- [x] Introduce fallback range computation helpers ensuring 400-bucket guard compliance (`src/features/analytics/domain/fallback-range.ts`).
- [x] Run `EXPLAIN ANALYZE` for lifecycle query using representative dataset and capture baseline latency (`documents/features/analytics/dashboard-lifecycle-performance.md`).

## 4. Service & Application Layer

- [x] Update `getDashboardVisualization.ts` to hydrate new metadata fields and fallback logic.
- [x] Ensure DTO serialization includes `requestedRange` and `actualRange` objects per metric.
- [x] Implement pagination metadata (`meta.totalMetrics`, `meta.fallbackMetrics`).
- [x] Wire observability hooks (structured logs for fallback events via `analytics.dashboard.fallback_range_used`).

## 5. Caching & ETag Strategy

- [x] Update ETag generator to hash metric + settings `updated_at` values alongside payload checksum (`vizDashKey` version cursor + `sync.etagSeed`).
- [x] Align `Cache-Control` headers with FE caching expectations (default `private, max-age=60, stale-while-revalidate=30`).
- [x] Document curl-based validation steps (`documents/features/analytics/dashboard-etag-validation.md`); automated tests remain pending under Testing phase.

## 6. Testing & Validation

- [x] Add unit tests for fallback bucket/range selection utilities (`__tests__/analytics/fallback-range.test.ts`).
- [x] Add integration tests covering: lifecycle metadata presence, fallback path, pagination metadata, ETag change on metadata update (`__tests__/analytics/dashboard-visualization.service.test.ts`).
- [ ] Regenerate OpenAPI docs and run contract tests (Schemathesis/Postman) against the updated schema.

### Testing Commands Reference

- `npm run test:dev` – Host-only Jest watch mode for day-to-day work; auto-sets `REDIS_REQUIRED=false` **and** `DB_HOST=127.0.0.1`. Start `docker compose up -d db redis` (or use local services) so Postgres/Redis are exposed on localhost before running.
- `npm run test:ci` – Docker-backed suite that orchestrates Postgres/Redis, runs migrations, and executes Jest with coverage/extra reporters via `scripts/test-ci.sh`.
- Before running host-side suites that hit the DB, migrate with `TEST_DATABASE_URL=postgres://lakira_user:lakira_password@127.0.0.1:5432/lakira_test_db DB_HOST=127.0.0.1 NODE_ENV=test npx sequelize-cli db:migrate --config src/config/config.cjs`.

## 7. Release Readiness

- [ ] Document rollout plan, including feature flag toggles and monitoring dashboards.
- [ ] Update runbooks with troubleshooting guidance for fallback signals and cache issues.
- [ ] Schedule coordinated QA session with frontend to verify empty-state scenarios.
- [ ] Announce change in release notes and internal changelog once production deploy is complete.
