# Feature Vertical Slice Migration Checklist
- Timestamp: 2025-12-02T14:09:29Z

## Governance
- [ ] Publish feature-foldering guidelines in `documents/development/features/README.md`.
- [ ] Announce migration plan to the team and capture Q&A.
- [x] Add lint rule (or manual review checklist) preventing new code in `src/services`. *(2025-12-03 — `eslint.config.mjs` now blocks `src/services/**` imports via `no-restricted-imports`.)*

## Phase 0 – Preparation
- [x] Create template README for every feature describing domain/application/infrastructure expectations. *(2025-12-02 — see `documents/development/features/README.md`)*
- [x] Identify owners for each domain (metrics, metric logs, auth, analytics, settings). *(2025-12-02 — see `domain-ownership-matrix.md`)*
- [x] Tag existing tickets that must pause until their target feature is migrated. *(2025-12-02 — documented in `migration-ticket-triage.md`; add label `blocked-by-vertical-slice` in tracker)*

## Phase 1 – Metric Feature
- [x] Scaffold `src/features/metric/{domain,application,infrastructure}` directories with index entrypoint. *(2025-12-02 — see `src/features/metric/`)*
- [x] Move business logic from `src/services/metric.service.ts` into use cases and aggregates. *(2025-12-02 — `CreateMetric` use case now drives POST /metrics)`*
- [x] Implement Sequelize repository + cache port under `src/features/metric/infrastructure`. *(2025-12-02 — repo + settings port + redis cache adapters added)*
- [x] Relocate HTTP controllers into the feature and update `src/routes` to import them. *(2025-12-02 — new handlers live in `src/features/metric/infrastructure/http/controller.ts`; `src/routes/metric.routes.ts` now references them)*
- [x] Add unit tests for domain/application (Metric entity + CreateMetric use case). *(2025-12-02 — see `__tests__/features/metric/**`)*  
- [x] Add integration tests for repository/controller. *(2025-12-02 — see `__tests__/features/metric/infrastructure/**` for repo + HTTP handlers)*
- [x] Remove or deprecate old metric service exports. *(2025-12-02 — `src/services/metric.service.ts` removed; controllers now use feature use cases)*

## Phase 2 – Metric Log Feature
- [x] Scaffold `src/features/metric-log` slice mirroring Metric structure and add README. *(2025-12-02)*
- [x] Implement create log use case and route integration. *(2025-12-02 — POST /metric-logs uses feature use case + adapters)*
- [x] Move log detail/update/delete endpoints onto feature use cases. *(2025-12-02)*
- [x] Port listing/stats/dummy endpoints into the feature. *(2025-12-02 — `ListMetricLogs`, stats, and dummy use cases added)*
- [x] Extract log-specific logic from `src/services/metric-log.service.ts` into use cases. *(2025-12-02 — service removed)*
- [x] Define cross-feature ports (e.g., metric existence checks) instead of direct model imports. *(2025-12-02 — `MetricAccessPort` + cache port wired)*
- [x] Update HTTP routes/controllers to live within the feature. *(2025-12-02 — routes import `src/features/metric-log/infrastructure/http/controller.ts`)*
- [x] Cover new code with unit + integration tests; ensure legacy endpoints still pass regression suite. *(2025-12-02 — see `__tests__/features/metric-log/**`; e2e suite to be rerun in Phase 2 test log)*

## Phase 3 – Other Domains
- [x] Migrate Auth into `src/features/auth` with its own domain/application/infrastructure stack. *(2025-12-03 — slice scaffolded with use cases + adapters; requires follow-up tests)*
- [x] Backfill Auth feature unit + integration coverage. *(2025-12-03 — `NODE_ENV=test SKIP_DB_LIFECYCLE=true npm run jest -- __tests__/features/auth/**/*.test.ts`; see `../logs/testing/phase3-test-log.md`)*
- [x] Migrate Metric Settings into a dedicated slice (`src/features/metric-settings/**`). *(2025-12-03 — controllers/routes now import the feature factory; legacy controller/service removed; see docs/README)*
- [x] Move Metric Settings cursor listing behind the feature repository/use case. *(2025-12-03 — `listMetricSettingsViaCursor` replaced with repository-backed use case)*
- [x] Move `/api/v1/metrics/:metricId/trends` onto analytics feature handlers. *(2025-12-03 — route now uses `handleMetricTrend`; `src/controllers/trend.controller.ts` removed)*
- [x] Route all analytics visualization/dashboard endpoints through the feature slice. *(2025-12-03 — `src/features/analytics/infrastructure/http/visualization.controller.ts` and router own the API; legacy controller removed)*
- [x] Repeat the slice migration for metric settings, analytics, and remaining services. *(2025-12-03 — metric settings + analytics routes/controllers now reside inside their slices; legacy services removed.)*
- [x] Verify no consumers import from `src/services`; provide codemod or lint to block regressions. *(2025-12-03 — manual `rg` clean + lint guard ensures future enforcement.)*

## Phase 4 – Infrastructure Alignment
- [x] Capture kickoff inventory and tracking doc. *(2025-12-03 — see `../tracking/phase4-progress.md` for remaining routes/controllers/models/middleware.)*
- [x] Define per-feature router factory pattern. *(2025-12-03 — documented in `../plans/phase4-router-refactor.md`.)*
- [x] Migrate Auth router to feature entrypoint. *(2025-12-03 — `src/server.ts` now imports `/api/v1/auth` router from `src/features/auth`.)*
- [x] Migrate Metric router to feature entrypoint. *(2025-12-03 — `/api/v1/metrics` now mounts `metricRouter` from `src/features/metric`.)*
- [x] Migrate Metric Log router to feature entrypoint. *(2025-12-03 — `/api/v1/metric-logs` now mounts `metricLogRouter` from `src/features/metric-log`.)*
- [x] Migrate Metric Settings router to feature entrypoint. *(2025-12-03 — `/api/v1/metric-settings` now mounts `metricSettingsRouter` from `src/features/metric-settings`.)*
- [x] Migrate Metric Category router to feature entrypoint. *(2025-12-04 — `/api/v1/metric-categories` now mounts `metricCategoryRouter` from `src/features/metric-category`.)*
- [x] Remove legacy `src/routes` folder, drop `@routes/*` alias, and add ESLint guardrails. *(2025-12-03 — folder deleted, jsconfig alias removed, `no-restricted-imports` blocks `src/routes/**`.)*
- [x] Remove legacy `src/controllers` folder, drop `@controllers/*` alias, and add ESLint guardrails. *(2025-12-03 — folder deleted, ts/js config cleaned, `no-restricted-imports` blocks `src/controllers/**`.)*
- [x] Remove legacy `@services/*` alias once service folder retirement is complete. *(2025-12-03 — config aliases cleaned; ESLint already blocks `src/services/**`.)*
- [x] Introduce per-feature ORM bootstrap helpers and keep `src/infrastructure/db/models.ts` as a thin composer. *(2025-12-03 — feature-level register/associate helpers added.)*
- [x] Relocate auth middleware into the feature slice and re-export for compatibility. *(2025-12-03 — `src/features/auth/infrastructure/http/authMiddleware.ts` now owns the JWT guard.)*
- [x] Move rate limiter middleware into a shared feature module. *(2025-12-03 — routers import from `src/shared/middleware/rate-limiter.ts`.)*
- [x] Move Zod validation middleware into a shared feature module. *(2025-12-03 — routers import `validate` from `src/shared/middleware/validation.ts`.)*
- [x] Move cache middleware into a shared feature module. *(2025-12-03 — routers import from `src/shared/middleware/cache.ts`.)*
- [x] Move role guard and `pickValidated` helpers into shared feature modules. *(2025-12-03 — see `src/shared/middleware/role.ts` and `src/shared/middleware/validated.ts`.)*
- [x] Document shared middleware conventions. *(2025-12-03 — see `../references/shared-middleware.md`.)*
- [x] Move error handler into shared feature module. *(2025-12-03 — see `src/shared/middleware/error.ts`.)*
- [x] Decide on strategy for ORM/model placement (shared lib vs. per-feature wrappers) and implement it. *(2025-12-04 — Removed the legacy `src/infrastructure/db/sequelize.ts`, centralized registration/caching in `src/infrastructure/db/models.ts`, and updated server/tests to rely on the per-feature register/associate helpers.)*
- [x] Update middleware/config to resolve dependencies via feature factories. *(2025-12-04 — `src/server.ts`, Jest setup, and the Sequelize transaction port now import `sequelize` + middleware directly from feature slices; `token-generator` no longer reaches into the old db singleton.)*
- [x] Archive or delete legacy folders (`src/services`, `src/controllers`, `src/routes`) once empty, then remove related path aliases. *(2025-12-04 — Verified the folders remain removed and cleaned `jsconfig.json` includes so IDE tooling only references `src/features/**` + shared infrastructure.)*
- [x] Run Phase 4 regression suites and log the results. *(2025-12-05 — Full suite executed via `DB_HOST=127.0.0.1 REDIS_REQUIRED=false NODE_ENV=test npm run jest -- --runInBand`; see `phase4-test-log.md`.)*
- [x] Migrate metric category services/controllers into domain + application layers. *(2025-12-05 — Legacy folder deleted; controllers/use cases/dummy generator now live under `src/features/metric-category/**`.)*

## Verification & Documentation
- [x] Run full test suite after each domain migration. *(2025-12-02 — see `../logs/testing/phase1-test-log.md`)*
- [x] Update `documents/development/features/<feature>/README.md` once the slice is stable. *(2025-12-03 — auth README now documents controllers + testing strategy)*
- [ ] Capture learnings/incidents in `documents/incidents` referencing timestamps.
- [ ] Review this checklist periodically and tick off completed items with dates + owners.
