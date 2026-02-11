# Lakira Backend Unit Tests

## 1. Overview

- Purpose: codify the second rung of the Lakira backend testing pyramid (after static checks) so that business logic, DTO mappers, and adapters are verified in-memory before any integration or contract suites execute.
- Owner: backend platform (@dimaspramudya) with Codex assistance; this folder captures the plan, checklist, ADRs, and runtime metrics that support interviews and CI/CD reviews.
- Inputs: repos already run Jest in multi-project mode (`unit` + `integration`), and the CI pipeline (`.github/workflows/backend-ci.yml`) executes `npm run test:unit` and `npm run test:unit:coverage` before heavier stages.
- Deliverables: stable scripts, documentation for contributors, coverage expectations, and a playbook for expanding suites over time.

## 2. Scope

- In scope:
  - Domain entities, application services, DTO mappers, adapters, schema validators, and repositories exercised with mocks/doubles.
  - Config helpers (`envManager`, logger formatting) that can run without network or DB dependencies.
  - Collection of coverage artifacts for CI (moved to `coverage/jest-unit` by the workflow after each run).
- Out of scope:
  - Tests touching Express, Sequelize, Postgres, or Redis - those belong in `__tests__/integration/**`.
  - Contract-suite logic (Postman/Newman) and staging validation; see `documents/tests/4-contract-tests/**`.
  - Static analysis (lint, typecheck, formatting) - tracked under `documents/tests/1-static-checks/**`.

## 3. Layout & Coverage Snapshot

- Location: all suites live under `__tests__/unit/**` and mirror the `src/` tree (`features/<domain>/<layer>`, `config/**`, etc.).
- Naming: files end with `.test.ts`; directories may include README notes when a feature requires sequencing.
- `jest.setup.unit.ts` injects `withTestEnv` so `SKIP_DB_LIFECYCLE` stays true and env caches reset per test.
- Feature coverage overview (2026-01-02):

| Feature Area            | Status    | Notes                                                                                                                                                                                                                                                          |
| ----------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                    | Mature    | Domain, application, HTTP controller, and Sequelize repo are fully covered via mocks.                                                                                                                                                                          |
| Metrics                 | Partial   | Domain/application/controller/HTTP router suites plus Redis cache invalidator now covered; read repositories + remaining shared utilities (token helpers) remain.                                                                                              |
| Metric Logs             | Partial   | Domain/application/controller + router suites plus Redis cache adapter and query repository are covered; visualization invalidators remain gaps.                                                                                                               |
| Metric Settings         | Improving | Domain entity + schema tests plus create/update/delete/goal/display use cases, HTTP controller endpoints, Sequelize repository, cache invalidator, and HTTP router coverage now in place.                                                                      |
| Analytics               | Partial   | Service/query suites cover core aggregation logic; HTTP router, visualization Redis cache, and invalidation adapter now have coverage (dashboard cache invalidator still monitored alongside repos).                                                           |
| Metric Categories       | Partial   | `GenerateDummyCategories` use case and the Sequelize repository/list helpers now have unit suites; HTTP router + cache adapters remain uncovered.                                                                                                              |
| Shared Middleware/Utils | Improving | Cache, error, rate limiter, and validation middleware plus `utils/date-io`, `utils/db-helper`, `utils/redis-client`, `shared/cache/logging`, `shared/cache/keys`, and `utils/token-generator` now covered; response formatter + analytics invalidators remain. |

## 4. Commands & Tooling

- `npm run test:unit`
  - Runs Jest with `--selectProjects unit`, `SKIP_DB_LIFECYCLE=true`, and `NODE_ENV=test`.
  - Enforces global coverage thresholds (≥ 60 % statements, ≥ 40 % branches, ≥ 55 % functions, ≥ 60 % lines) via `jest.config.mjs`; failures surface directly in CI if regressions appear.
  - Current runtime: ~13 s locally on Node 20/npm 11 (2026-01-06, 55 suites / 222 specs after response-formatter coverage; see `metrics-tracker.md`).
- `npm run test:unit:coverage`
  - Adds `--coverage`; Jest writes to `coverage/jest`, and CI moves the folder to `coverage/jest-unit` before uploading artifacts alongside the `coverage/junit/unit.xml` report emitted by `jest-junit`.
  - Latest coverage snapshot (2026-01-06): 68.41 % statements, 48.68 % branches, 66.01 % functions, 68.59 % lines (metric log query repo + cache key helper + token generator suites landed; response formatter keeps parity).
- `npm run test:dev`
  - Watch mode covering both Jest projects; integration suites will skip DB bootstrapping because SKIP_DB_LIFECYCLE is set globally.
- Helpers:
  - Use `withTestEnv` to override env vars within a suite.
  - Reuse deterministic builders under `__tests__/unit/factories/**` (e.g., `buildMetricSettings`) to avoid re-declaring fixtures.
  - Prefer absolute imports (`@/feature/...`) so files can move freely.
  - Mock external adapters with `jest.fn()` or dedicated test doubles; no network or DB connections should be opened.

## 5. Workflow Expectations

- Follow `WORKFLOW_GUIDELINES.md` for per-PR steps:
  1. Identify which domain/service/router change is being made.
  2. Update or add the corresponding unit suite under `__tests__/unit/**`.
  3. Record gaps/coverage deltas in the plan/checklist when new surface areas are added.
  4. Re-run `npm run test:unit` (and `:coverage` when touching critical flows) before pushing.
- For new features, create both:
  - Positive-path tests (happy flow, cached/un-cached \(if applicable\)).
  - Negative-path tests (validation, authorization, invariants).
- Keep fixtures deterministic; leverage builders/factories or inline objects rather than pulling from seeded data.

## 6. Verification & Reporting

- Local developers should run `npm run test:unit` prior to every commit; CI will fail the pipeline if the command exits non-zero.
- Coverage verification happens in two steps:
  - `npm run test:unit:coverage` locally when working on high-risk features.
  - GitHub Actions runs the same command, enforces the thresholds in `jest.config.mjs`, and uploads both `coverage/jest-unit` and `coverage/junit/unit.xml` artifacts for PR reviewers.
- Observability:
  - Jest summary reporter already prints suite/test counts; additional reporters (JUnit, Sonar) can be added later via ADR.
  - Flake triage guidance lives in the plan/checklist; open incidents can be logged in `incidents.md`.

## 7. KPIs & Maintenance

- Runtime target: <= 90 s locally / <= 3 m in CI (current baseline: 24 s local).
- Coverage target: maintain ≥ 60 % statements / ≥ 40 % branches (thresholds enforced via Jest) while continuing to nudge branches/functions upward as new suites land.
- Escape rate: zero flaky/unit regressions accepted on main; use `incidents.md` if a failure reaches main or production.
- Review cadence: revisit metrics and decisions quarterly (aligned with static-check reviews); log adjustments in `decisions.md`.

## 8. References

- [`WORKFLOW_GUIDELINES.md`](./WORKFLOW_GUIDELINES.md) - per-PR process and authoring guardrails.
- [`unit-tests-plan.md`](./unit-tests-plan.md) - phases, milestones, and risk management.
- [`unit-tests-checklist.md`](./unit-tests-checklist.md) - task-level status.
- [`metrics-tracker.md`](./metrics-tracker.md) - runtime and coverage history.
- [`decisions.md`](./decisions.md) - ADRs for tooling/strategy.
- [`documents/ci-cd/backend/*.md`](../../ci-cd/backend) - CI expectations for unit stage.
