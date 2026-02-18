# Integration Tests Plan

## Context & Goals

- Static checks and unit tests already run as independent stages with documentation, KPIs, and workflows (see `documents/tests/2-unit-tests/**`). According to `documents/ci-cd/backend/CI_CD_STRATEGY.md`, the next maturity step is a production-grade integration suite that proves database + HTTP wiring.
- The suite currently contains 13 green suites (API + repository coverage) living under `__tests__/integration/**`, but until now lacked a dedicated plan, checklist, or measurement cadence.
- Goals for this plan:
  - Document how we audit the existing setup (helpers, scripts, CI wiring) and what remains to reach portfolio-grade depth.
  - Sequence the work needed to harden infra dependencies (Docker services, migrations, Redis toggles) and data hygiene.
  - Define success metrics (runtime, coverage, scenario backlog) plus risks/open questions so future contributors have a single source of truth.

## Phases & Milestones

1. **Phase 0 – Baseline Audit (complete – 2026-01-09)**
   - Inventory suite layout, helper modules, and DB lifecycle behavior; summarize in `README.md`. ✅
   - Confirm commands/scripts (`test:integration`, `test:integration:coverage`, `test:ci`, Docker compose stack) and ensure they match CI documentation. ✅
   - Capture outstanding infra blockers (Redis disabled in tests, need for deterministic fixtures, no metrics tracker) and move them into this plan/checklist. ✅

2. **Phase 1 – Environment Hardening & Tooling (in progress)**
   - Provide explicit instructions for `.env.test`, Docker Compose bootstrapping, and migration sequencing in README + checklist. ✅ (README updated with commands and cautions.)
   - Add automation around DB seeding/reset (`scripts/test-ci.sh`, future Make/NPX shortcuts) so contributors can run the same flow locally as CI. ✅ (2026-01-12 – `npm run integration:local` chains migrations + tests.)
   - Introduce a documented way to opt into Redis during integration tests (e.g., `ENABLE_REDIS_INTEGRATION=true`) without breaking current workflows; ensure `jest.setup.ts` and helpers respect the toggle. ✅ (2026-01-12 – `ENABLE_REDIS_INTEGRATION` flag parsed via `zodEnv`, documented in `.env.test.example`, and wired into `redis-client.ts`.)
   - Expand fixture coverage to include seeded dashboards/users for cross-feature scenarios; document when to use HTTP helpers vs. direct model factories. ✅ (2026-01-12 – `createUserWithCategory`, `seedMetricWithLogs`, and `seedDashboardMetric` helpers published and adopted by analytics repo suites.)
   - Track runtime/coverage metrics after the next Compose-backed run so the metrics tracker stays grounded.

3. **Phase 2 – Coverage Depth & User Journeys (complete – 2026-01-13)**
   - ✅ (2026-01-13) Added `__tests__/integration/api/journeys/onboarding.integration.test.ts` to cover the full onboarding journey (register → configure metric/settings → log → analytics).
   - ✅ (2026-01-13) Extended API coverage for duplicate metric-log timestamps: create + update flows now enforce HTTP 409 and are asserted in `api/metric-log.test.ts`.
   - ✅ (2026-01-13) Introduced Redis-backed integration suites (`features/analytics/VisualizationCacheRedis.integration.test.ts` + Redis block in `api/analytics.test.ts`) gated by `ENABLE_REDIS_INTEGRATION` to prove cache hydration/invalidations.
   - ✅ (2026-01-13) Published `seedDashboardWithMetrics` fixture to seed reusable dashboards for analytics suites, removing ad-hoc inserts.
   - ✅ (2026-01-13) Updated `documents/tests/overhaul/phase2-integration-coverage.md` and the metrics tracker with the new targets/helpers so contributors can trace scope.

4. **Phase 3 – Observability & Enforcement (complete – 2026-01-13)**
   - ✅ (2026-01-13) Added project-specific coverage thresholds so the integration suite now enforces ≥70 % statements / 45 % branches / 70 % functions / 70 % lines (unit thresholds remain at 60/40/55/60).
   - ✅ (2026-01-13) Configured `jest-junit` reporters per project so CI publishes `coverage/junit/unit.xml` and `coverage/junit/integration.xml`.
   - ✅ (2026-01-13) Logged a flake-handling playbook in `incidents.md` and scheduled quarterly KPI reviews (first work week of Mar/Jun/Sep/Dec) with action items captured in the metrics tracker.

5. **Phase 4 – Redis Nightly CI Coverage (blocked until `documents/tests/4-contract-tests/**` ships)\*\*
   - Document requirements for a Redis-enabled nightly/cron CI job (env vars, Docker services, runtime expectations) and add them to README/checklist/plan. This phase must not start until the contract test documentation + suites are implemented so CI priorities stay focused.
   - Extend `integration-tests-ticket.md` + checklist with acceptance criteria for the Redis job: flag defaults, GitHub Actions workflow sketch, artifact expectations, and owner assignments.
   - Update `metrics-tracker.md` with a dedicated row for the Redis nightly run (target runtime, frequency, owner) and record the first baseline after the contract-test milestone completes.
   - Add guardrails for flipping `ENABLE_REDIS_INTEGRATION` default once the nightly job has been stable for ≥2 weeks (document the success criteria + rollback steps in `decisions.md`).

## Success Criteria

- README + plan + checklist + ticket + decision log + incidents + metrics exist under `documents/tests/3-integration-tests/` and stay updated alongside code.
- Developers can run `npm run db:migrate:test && npm run test:integration` (or `npm run test:ci`) locally with predictable setup/teardown instructions.
- Metrics tracker captures runtime, suite counts, and coverage so regressions are visible. Coverage and scenario backlogs trend toward the defined targets.
- Redis-enabled scenarios, cross-feature journeys, and HTTP-level negative cases exist so CI proves the system behaves correctly under real dependencies.
- CI uploads integration coverage artifacts and, once Phase 3 lands, XML reports + enforced thresholds.

## Risks & Mitigations

- **Infra dependency drift:** Postgres/Redis versions or env vars may diverge between local + CI. Mitigation: keep docker-compose files + README in sync and rely on `scripts/test-ci.sh` for hermetic runs.
- **Redis remains unused:** Because tests skip Redis today, cache regressions could slip by. Mitigation: add an opt-in toggle plus documented steps to run Redis-backed suites; treat redis coverage gaps in the checklist.
- **Runtime creep:** Truncating tables between every spec plus wide coverage may slow runs. Mitigation: group specs by feature, reuse transactions in repo tests, and monitor runtime in the metrics tracker.
- **Fixture divergence:** Duplicate builders or manual SQL can drift from production models. Mitigation: centralize in `helpers/test-utils.ts` and `helpers/db-fixtures.ts`, document updates, and reference them from both API + repo suites.
- **Documentation rot:** Without explicit owners, README/checklist risk becoming stale. Mitigation: require doc updates in the PR checklist and review docs alongside code changes touching integration tests.

## Open Questions (resolved 2026-01-14)

- **Redis default toggle – decision:** keep Redis opt-in via `ENABLE_REDIS_INTEGRATION` until we introduce a dedicated Redis-backed CI job/nightly run. Defaulting to `true` would force every contributor (and CI PR run) to provision Redis, slowing feedback loops and creating noisy failures when Redis is unavailable. Instead, Redis suites stay guarded while we document how to trigger them in README/checklist and log results in `metrics-tracker.md`. (See `decisions.md` → INT-ADR-006.)
- **Analytics fixtures vs. seed migrations – decision:** continue relying on programmatic helpers (`seedDashboardWithMetrics`, `seedDashboardMetric`, etc.) rather than baking dashboards/visualizations into migrations. Migrations would introduce shared state across suites and complicate teardown, while fixtures keep every spec self-contained, faster to iterate on, and compatible with raw SQL truncation. (See INT-ADR-007.)
- **Transactions vs. raw truncation for repository suites – decision:** retain the global raw-SQL truncation strategy documented in `jest.setup.ts`. Wrapping each spec inside explicit transactions would add per-spec setup logic and risks cross-worker conflicts, yet only saves a few seconds given the current 55–60 s runtime. We will revisit if runtime breaches the 90 s local / 5 m CI guardrails captured in `metrics-tracker.md`. (See INT-ADR-008.)

## Current Findings (2026-01-09)

- Suite count: 13 (API + docs + repository coverage) as recorded in `documents/tests/test-classification-2025-12-22.md`.
- Helpers: `__tests__/integration/helpers/test-utils.ts` (HTTP) and `db-fixtures.ts` (raw models) cover all current needs but require extensions for Redis + dashboard journeys.
- Runtime/Coverage: quantitative numbers pending the next Docker-backed local run (blocked on Compose permissions in this environment). Checklist item tracks capturing both metrics once services are available.
