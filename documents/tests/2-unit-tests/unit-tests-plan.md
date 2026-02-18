# Unit Tests Plan

## Context & Goals

- The repo already ships Jest multi-project config plus scripts (`test:unit`, `test:unit:coverage`), yet documentation, KPIs, and coverage priorities were missing.
- Static checks (Phase 1 of the testing pyramid) are now complete; per the CI/CD strategy (`documents/ci-cd/backend/**`), unit tests are the next gate before integration and contract suites.
- Goals:
  - Capture baseline runtime/coverage metrics so future improvements are measurable.
  - Document expectations, workflows, and ownership for a portfolio-grade unit test stage.
  - Identify and sequence coverage gaps (routers, caches, middleware) ahead of integration/contract investments.

## Phases & Milestones

1. **Phase 0 - Baseline Inventory (complete)**
   - Confirm scripts (`npm run test:unit`, `npm run test:unit:coverage`) and env guarantees (`SKIP_DB_LIFECYCLE=true`, `withTestEnv`). [done]
   - Record runtime (~24 s) and coverage snapshot (44.7 % statements) in `metrics-tracker.md`. [done]
   - Inventory existing suites vs. feature map; highlight uncovered areas (metric settings, routers, cache adapters). [done]

2. **Phase 1 - Documentation & Workflow Alignment (in progress)**
   - Publish README, workflow guidelines, plan, checklist, ticket, ADRs, incident log, and metrics tracker. [done] (this change)
   - Define per-PR workflow mirroring contract-test thoroughness (`WORKFLOW_GUIDELINES.md`). [done]
   - Capture decisions about Jest setup, builders, and coverage expectations in `decisions.md`. [in-progress] (ongoing as new conventions emerge; shared factories now live under `__tests__/unit/factories/**`.)

3. **Phase 2 - Coverage Expansion (in progress)**
   - Prioritize suites for zero-coverage areas:
     - Metric settings use cases/repos (create/update/delete/goal management). [done for use cases, controller, repository, cache invalidator, and HTTP router as of 2025-12-30.]
     - Cache adapters (metric, metric log, analytics invalidators).
     - HTTP routers/middleware (analytics, metrics, metric logs, metric settings, shared middleware). [analytics/metric/metric-log/metric-settings routers now covered; cache/error/rate limiter/validation middleware all covered as of 2026-01-02.]
     - Shared utilities (`date-io`, `db-helper`, `redis-client`) and providers (Redis, JWT, bcrypt wrappers).
   - Track progress in `unit-tests-checklist.md` and ensure each addition records coverage deltas.
   - Target >= 60 % statements / >= 40 % branches by the time all priority suites are in place.

4. **Phase 3 - CI Observability & Enforcement (in progress)**
   - Raised Jest `coverageThreshold` (≥ 60 % statements / ≥ 40 % branches / ≥ 55 % functions / ≥ 60 % lines) so regressions fail `npm run test:unit`; recorded the decision in `decisions.md` (UT-ADR-004).
   - Added `jest-junit` reporter so CI uploads `coverage/junit/unit.xml` alongside `coverage/jest-unit`; surfaced usage in README + workflow guidelines.
   - Documented flake logging (workflow guidelines + `incidents.md` template) and scheduled quarterly KPI reviews via `metrics-tracker.md`; continue monitoring for future automation opportunities (e.g., retry tooling).

## Success Criteria

- Documentation clearly states layout, workflow, KPIs, and coverage targets (`README.md`, `WORKFLOW_GUIDELINES.md`).
- `unit-tests-checklist.md` shows progress through coverage priorities with owners/dates.
- CI uploads `coverage/jest-unit` artifacts for every PR, and reviewers can inspect deltas easily.
- Runtime remains within targets (<= 90 s local / <= 3 m CI) as suites grow.
- Coverage improves from 44.7 % statements to at least 60 % with explicit notes on remaining gaps.

## Risks & Mitigations

- **Coverage debt stays high:** Without focus, routers/caches remain untested. Mitigation: maintain prioritized backlog in the checklist and tie it to feature work.
- **Runtime bloat:** Adding many suites could slow Jest. Mitigation: keep SKIP_DB enforced, mock heavy adapters, and monitor runtime metrics.
- **Mock drift:** Excessive mocking can hide integration bugs. Mitigation: coordinate with integration test owners to ensure important paths also have end-to-end coverage.
- **Documentation rot:** Without upkeep, plan/checklist lose value. Mitigation: require doc updates as part of every unit-test-affecting PR (mirroring contract workflow guidelines).

## Open Questions

- Do we need additional automation (e.g., Jest retry plugins or `--bail` tuning) to assist with future flake detection?
- Should we introduce HTML coverage summaries or Sonar-compatible reporters alongside the new JUnit file for interview demos?
- Are there remaining domains that would benefit from dedicated factory modules beyond the existing metric settings builder?

## Current Findings (2026-01-06)

- `npm run test:unit` completes in ~13 s locally with 55 suites / 222 tests.
- Coverage improved to 68.41 % statements / 48.68 % branches / 66.01 % functions / 68.59 % lines (`npm run test:unit:coverage`).
- Coverage hotspots:
  - `features/metric-settings/**` remains in strong shape (use cases, controllers, repositories, cache invalidator, and router).
  - `features/metric/**` and `features/metric-log/**` both keep router coverage alongside domain/application/controller suites; all Redis cache adapters (metric, metric-log, visualization) plus the metric-log query repo now have suites.
  - `shared/middleware/cache.ts`, `error.ts`, `rate-limiter.ts`, and `validation.ts` now have suites covering happy/error paths; cache middleware also exposes a test-only override so suites can bypass the test-env guard when exercising cache writes/reads.
  - `shared/cache/logging.ts`, `shared/cache/keys.ts`, `utils/date-io.ts`, `utils/db-helper.ts`, `utils/redis-client.ts`, `utils/token-generator.ts`, and `utils/response-formatter.ts` now have dedicated suites.
  - `features/metric-category/infrastructure/persistence/MetricCategoryRepoSequelize.ts` now has repository coverage, though HTTP router + cache adapters remain.
  - `features/metric-log/infrastructure/persistence/MetricLogQueryRepoSequelize.ts` now has pagination/filter coverage, closing the prior query-repo gap.
  - `features/analytics/infrastructure/http/router.ts`, `VisualizationCacheRedis`, and `VisualizationInvalidationAdapter.ts` are all covered; remaining work targets optional helpers before moving to enforcement.
- CI still renames coverage folders in `backend-ci.yml`, but no Jest coverage thresholds are enforced yet; revisit this after the remaining utilities/invalidators land.
