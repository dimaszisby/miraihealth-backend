# Lakira Backend Integration Tests

## 1. Overview

- This kit governs the integration layer of the Lakira backend testing pyramid: suites that boot the real Express app plus Sequelize/Postgres (and optionally Redis) to verify HTTP handlers, repositories, and infrastructure wiring.
- Ownership: backend platform (@dimaspramudya) with Codex support. The folder is intentionally portfolio-ready so reviewers can trace how integration quality is enforced.
- Context: `documents/ci-cd/backend` defines the CI/CD strategy; `.github/workflows/backend-ci.yml` runs these suites (without and with coverage) right after unit tests and before contract tests.

## 2. Scope

**In scope**

- API suites under `__tests__/integration/api/**` that exercise auth, metrics, metric logs, metric settings, metric categories, and analytics routes end-to-end via `supertest`.
- Docs/OpenAPI verification under `__tests__/integration/docs/**`.
- Repository-level suites under `__tests__/integration/features/**` that hit Sequelize models alongside the real Postgres schema (Metric, MetricRead, MetricSettings, MetricLog, MetricLogQuery, VisualizationRead, User repositories).
- Tooling required to run those suites: Docker Compose services, `jest.setup.ts`, helper/fixture modules, and CI instrumentation.

**Out of scope**

- Newman/contract suites (see `documents/tests/4-contract-tests/**`).
- Front-end or staging E2E coverage.
- Static checks and unit suites (see `documents/tests/1-static-checks/**` and `documents/tests/2-unit-tests/**`).

## 3. Layout & Coverage Snapshot (2026-01-13)

- Integration suites live entirely under `__tests__/integration/**` and use `helpers/` for shared fixtures/utilities. API suites are grouped by resource, repository suites reside under `features/**`, and cross-feature journeys are located in `api/journeys/**`.
- Current footprint (15 suites, ~90 specs) after the backfill tracked in `documents/tests/overhaul/phase2-integration-coverage.md`:

| Surface                               | Status   | Notes                                                                                               | Primary Suites                                                                                                                                       |
| ------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth HTTP flows                       | Mature   | Register/login/profile, token issuance, and failure modes.                                          | `__tests__/integration/api/auth.test.ts`                                                                                                             |
| Metric API                            | Mature   | CRUD, cursor pagination, analytics trends, and validation/auth guards.                              | `__tests__/integration/api/metric.test.ts`                                                                                                           |
| Metric settings API                   | Mature   | Goal/display toggles, cursor pagination, and ownership enforcement.                                 | `__tests__/integration/api/metric-settings.test.ts`                                                                                                  |
| Metric logs API                       | Mature   | CRUD plus timestamp uniqueness and trend calculations.                                              | `__tests__/integration/api/metric-log.test.ts`                                                                                                       |
| Metric categories API                 | Stable   | CRUD and auth gating for categories.                                                                | `__tests__/integration/api/metric-category.test.ts`                                                                                                  |
| Analytics endpoints                   | Stable   | Dashboard and per-metric visualization flows over seeded logs.                                      | `__tests__/integration/api/analytics.test.ts`                                                                                                        |
| Cross-feature journeys                | Emerging | New onboarding flow covering register → metric config → logs → analytics to mimic production flows. | `__tests__/integration/api/journeys/onboarding.integration.test.ts`                                                                                  |
| Docs / Swagger                        | Stable   | Protects docs routes and validates OpenAPI JSON output.                                             | `__tests__/integration/docs/swagger.test.ts`                                                                                                         |
| User repository                       | Mature   | Create/save/lookups, uniqueness, bcrypt hooks hitting the real table.                               | `__tests__/integration/features/auth/UserRepositorySequelize.integration.test.ts`                                                                    |
| Metric repositories (write + read)    | Mature   | Transactional create/save/delete, ownership checks, cursor pagination, soft-delete filtering.       | `__tests__/integration/features/metric/*.integration.test.ts`                                                                                        |
| Metric settings repository            | Mature   | CRUD, uniqueness per metric, display options, cursor filters.                                       | `__tests__/integration/features/metric-settings/MetricSettingsRepositorySequelize.integration.test.ts`                                               |
| Metric log repositories (write/query) | Mature   | Timestamp uniqueness, CRUD lifecycle, pagination, numeric filters.                                  | `__tests__/integration/features/metric-log/MetricLogRepoSequelize.integration.test.ts`                                                               |
| Analytics visualization repository    | Mature   | Dashboard + per-metric SQL pipelines and cache-aware behaviors.                                     | `__tests__/integration/features/analytics/VisualizationReadRepoSequelize.integration.test.ts`                                                        |
| Analytics Redis cache adapters        | Emerging | Redis-backed cache hydration + invalidation proved via opt-in suites (`ENABLE_REDIS_INTEGRATION`).  | `__tests__/integration/features/analytics/VisualizationCacheRedis.integration.test.ts`, Redis block in `__tests__/integration/api/analytics.test.ts` |
| Phase 2 repo coverage tracker         | Complete | Remaining repo-level targets and historical status recorded for traceability.                       | `documents/tests/overhaul/phase2-integration-coverage.md`                                                                                            |

Open improvement items (Redis usage, end-to-end user journeys, pre-seeded fixtures) are tracked in `integration-tests-plan.md` and the checklist.

## 4. Environment & Dependencies

- Requires Postgres 15+/Redis 6+ reachable via the host/ports defined in `.env.test`. Local bootstrap:  
  `docker compose -f docker-compose.yml -f docker-compose.test.yml up -d db redis` (requires Docker Desktop access).
- Copy `.env.test.example` to `.env.test` (or source the values in your shell) before running migrations/tests. The sample file mirrors CI defaults so new contributors can get started without digging through history.
- Run migrations before tests:  
  `npm run db:migrate:test`  
  (internally maps to `npx sequelize-cli db:migrate --config src/config/config.cjs` with test env vars).
- `jest.setup.ts` boots the Express server on `4000 + JEST_WORKER_ID`, authenticates with Postgres, and truncates tables between specs through raw SQL (skipping `SequelizeMeta` tables). Set `SKIP_DB_LIFECYCLE=true` when you need helpers without launching the server (e.g., lint or storybook builds).
- Redis connections are skipped when `NODE_ENV=test`. Opt in per run by exporting `ENABLE_REDIS_INTEGRATION=true` (documented in `.env.test.example`) when you have a local Redis service running and want suites to exercise cache behavior. Redis-dependent integration specs automatically skip when the flag is false.

## 5. Commands & Tooling

| Command / Script                                                                      | Purpose                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:integration`                                                            | Executes the Jest `integration` project without coverage. Requires Postgres ready + migrations applied.                                                                                                         |
| `npm run integration:local`                                                           | Convenience wrapper that chains `npm run db:migrate:test` and `npm run test:integration` for local dev parity with CI.                                                                                          |
| `npm run test:integration:coverage`                                                   | Same project with `--coverage`. CI renames `coverage/jest` to `coverage/jest-integration` before uploading artifacts.                                                                                           |
| `ENABLE_REDIS_INTEGRATION=true npm run test:integration -- --runTestsByPath <suites>` | Runs only the Redis-gated suites when Redis is available locally or in CI (opt-in to avoid breaking default flows).                                                                                             |
| `npm run test:ci`                                                                     | Docker-first workflow that boots db/redis, runs migrations, then runs `test:unit`, `test:integration`, and `test:integration:coverage` inside the container (emitting `coverage/junit/{unit,integration}.xml`). |
| `docker compose ... up -d db redis`                                                   | Launches the infra services from `docker-compose.yml` + `docker-compose.test.yml` for local runs.                                                                                                               |
| `.github/workflows/backend-ci.yml (tests job)`                                        | Mirrors the above: migrations → unit → integration → coverage, with artifacts uploaded for review.                                                                                                              |

Remember to export `SKIP_DB_LIFECYCLE=true` if you must import `jest.setup.ts` helpers from tooling that cannot spin up Postgres.

## 6. Data Management & Helpers

- HTTP suites rely on `__tests__/integration/helpers/test-utils.ts` for deterministic payload builders, token generation, and request helpers (`authHeader`, `createMetricLog`, etc.).
- Repository suites lean on `__tests__/integration/helpers/db-fixtures.ts` for raw row factories plus `runInTransaction`, `seedMetricWithLogs`, `seedDashboardMetric`, `seedDashboardWithMetrics`, and `createUserWithCategory()` when bypassing the global setup. These helpers keep analytics/dashboard suites DRY and reproducible.
- Table truncation intentionally skips migration bookkeeping tables. When schema changes introduce new tables, update either the raw SQL query in `jest.setup.ts` or the helper list so cleanup remains deterministic.
- Keep suites idempotent: seed within the test, assert against the rows you insert, and avoid reusing IDs across files.

## 7. Workflow Expectations

1. Extend or add integration suites alongside any feature that touches DB schemas, repositories, or HTTP wiring; reference relevant helpers instead of ad-hoc fixtures.
2. Update this README + plan/checklist whenever new helpers, flows, or CI behaviors are introduced.
3. Record runtime/coverage numbers in `metrics-tracker.md` after every major CI run; log flake regressions in `incidents.md`.
4. Prefer `npm run test:ci` (Docker) when you need a hermetic environment; otherwise run `npm run db:migrate:test && npm run test:integration`.

## 8. CI/CD Alignment & Reporting

- The `tests` job provisions Postgres and Redis service containers, runs migrations, then executes `test:integration` and `test:integration:coverage`. Coverage artifacts sit under `coverage/jest-integration` alongside the unit artifacts collected earlier in the job.
- Each Jest project enforces its own coverage threshold (unit ≥60/40/55/60, integration ≥70/45/70/70 for statements/branches/functions/lines respectively), so regressions fail fast inside CI.
- Local Dev ↔ CI parity is maintained via the same scripts. If you rely on Docker, `scripts/test-ci.sh` mirrors the workflow exactly.
- CI publishes `coverage/junit/unit.xml` and `coverage/junit/integration.xml` so dashboards/interviews can ingest per-layer results; upload steps live alongside the coverage/artifact stages.
- Decisions about Redis toggles, coverage enforcement, and helper placement live in `decisions.md`. Incidents (flakes, infra drift) and KPIs are tracked via `incidents.md` + `metrics-tracker.md`.

## 9. References

- [Plan](./integration-tests-plan.md)
- [Checklist](./integration-tests-checklist.md)
- [Ticket](./integration-tests-ticket.md)
- [Decision log](./decisions.md)
- [Incidents](./incidents.md)
- [Metrics tracker](./metrics-tracker.md)
- [Audit](./integration-tests-audit.md)
- [Phase 2 integration coverage tracker](../overhaul/phase2-integration-coverage.md)
- [CI/CD backend docs](../../ci-cd/backend/README.md)
- [Testing strategy](../TESTING_STRATEGY.md)
