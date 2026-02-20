# Unit Test Workflow Guidelines - Lakira Backend

## 1. Purpose

These guidelines define when and how to update the Lakira backend **unit test** suite so that:

- Every domain, application, and adapter change ships with targeted Jest coverage.
- Contributors have a repeatable checklist that mirrors the thoroughness documented for contract tests.
- CI/CD (see `documents/ci-cd/backend/**`) can rely on consistent scripts, artifacts, and failure signals.

This workflow applies to backend feature work, refactors, and bug fixes touching any code that can be exercised without real Postgres/Redis connections.

---

## 2. When to Update Unit Tests

Update or add unit suites whenever:

- You introduce or modify:
  - Domain entities/value objects (e.g., `Metric`, `MetricSettings`, `AuthUser`).
  - Application services/use cases and queries.
  - DTO mappers, schema validators, cache invalidators, or other adapters that can be mocked.
- Repositories change logic that can be mocked (e.g., transforming Sequelize results before returning to callers).
- HTTP controllers or routers add new branches/guards but can be tested with mocked services (e.g., verifying middleware orchestrations).
- Shared utilities (`utils/`, `shared/middleware`) gain logic that does not require a real server stack.
- Bugs are fixed in any of the above areas; add regression tests proving the bug cannot reappear.

> Special note for Codex: when touching files inside `src/features/**` (domain/application/infrastructure) or `src/shared/**`, prompt for the affected unit suites and ensure the checklist below is followed.

---

## 3. Per-PR Developer Workflow

1. **Identify scope**
   - Classify the change (domain, application, HTTP adapter, cache, schema, etc.).
   - Review existing suites under `__tests__/unit/**` for the same feature; note gaps to fill.

2. **Design test cases**
   - Happy-path assertions (expected DTO, caches invalidated, events emitted).
   - Guard rails (authorization, validation, invariants).
   - Edge cases (empty collections, optional fields, toggles).

3. **Implement or update suites**
   - Place tests in the mirrored folder (e.g., `src/features/metric/application/CreateMetric.ts` -> `__tests__/unit/features/metric/application/CreateMetric.test.ts`).
   - Use Jest mocks/fakes instead of real Sequelize/Redis/Express instances.
   - Wrap environment overrides with `withTestEnv` only when the code under test reads from `process.env`.

4. **Run commands locally**
   - `npm run test:unit`
   - `npm run test:unit:coverage` if the feature is part of a critical path (auth, metrics, analytics aggregates) or when updating coverage-sensitive files.

5. **Document deltas**
   - Update `unit-tests-plan.md` or the checklist when new work lands (e.g., mark a gap as addressed).
   - Capture notable decisions (new helper, factory, or mocking pattern) in `decisions.md`.
   - Record KPI changes (runtime/coverage) in `metrics-tracker.md`.

6. **Push & review**
   - Include test output in PR description when touching risk areas.
   - Ensure CI upload (`coverage/jest-unit`) contains new files; attach summary metrics if needed.

7. **When coverage is missing**
   - If business timelines prevent immediate tests, log the omission in the checklist and open a TODO with owner/date. The CI gate should still pass, but you must leave breadcrumbs for follow-up.

---

## 4. Authoring Guidelines

- **Pure functions first:** Keep logic in domain/application layers, then plug them into controllers/infrastructure to maximize unit coverage.
- **Mocking strategy:**
  - Prefer inlined Jest mocks for simple dependencies (`const repo = { save: jest.fn() }`).
  - Introduce named fakes/builders (`makeMetric`, `fakeUser()`) when re-used across suites.
  - For cache invalidators or providers, stub the interface methods; never import actual Redis clients or HTTP servers.
- **Factories:**
  - Store reusable builders under `__tests__/unit/factories/**` (e.g., `buildMetricSettings`) so fixtures stay consistent and easy to evolve.
  - When introducing a new domain, add a builder before writing multiple suites to avoid duplicating payloads.
- **Error assertions:**
  - Use `await expect(promise).rejects.toThrow(AppError)` to verify invariants.
  - Provide explicit messages or codes when verifying error responses.
- **Deterministic data:**
  - Seed fixed timestamps and IDs. Avoid `Date.now()` without overriding via `jest.spyOn(Date, "now")`.
- **Snapshot usage:**
  - Prefer explicit assertions. Snapshots are acceptable only for large DTOs that rarely change; document rationale in test comments if you add one.

---

## 5. Coverage Targets & Priorities

Current coverage (2026-01-06) sits at **68.41 % statements / 48.68 % branches / 66.01 % functions / 68.59 % lines**, which clears the enforced Jest thresholds (≥ 60 % statements / ≥ 40 % branches / ≥ 55 % functions / ≥ 60 % lines). Keep the bar high by focusing on:

1. **Metric settings & categories**
   - Use case + controller coverage plus cache invalidator, repository, and HTTP router tests remain complete; metric categories’ repository adapter coverage is still pending.
2. **Shared middleware**
   - Cache, error, rate limiter, and validation middleware now have suites; keep parity for any new middleware helpers introduced later.
3. **Cache adapters**
   - Redis adapters (`MetricCacheRedis`, `MetricLogCacheRedis`, `VisualizationCacheRedis`) still report 0 %; add suites verifying cache keys, TTLs, and invalidation conditions.
4. **HTTP routers & middleware adjacents**
   - Analytics/metric/metric-log/metric-settings routers are covered; keep parity for any new routers and add suites for shared middleware helpers introduced later.
5. **Utilities**
   - `utils/date-io.ts`, `utils/db-helper.ts`, `utils/redis-client.ts`, `shared/cache/logging.ts`, and any new helpers should stay covered; when adding utilities, stub timers/clients and extend the suite immediately.

Prioritize the features above when planning new work; mark progress in the plan/checklist.

---

## 6. Tooling & CI Alignment

- Jest multi-project config (`jest.config.mjs`) already isolates the `unit` project.
- `jest.setup.unit.ts` ensures `withTestEnv` runs before each spec so environment caches are fresh.
- CI job `tests` executes:
  1. `npm run test:unit`
  2. `npm run test:unit:coverage`
  3. Moves `coverage/jest` -> `coverage/jest-unit`
  4. Uploads both coverage folders **and** `coverage/junit/unit.xml` (generated by `jest-junit`) for reviewers or dashboards.
- When adding new reporters (e.g., JUnit), update both the workflow and this guideline; keep parity between local scripts and CI.

## 8. Flake & Incident Handling

- If `npm run test:unit` fails intermittently or CI reports a flaky suite, immediately:
  1. Capture logs and the failing spec name.
  2. File an entry in `documents/tests/2-unit-tests/incidents.md` using the provided template.
  3. Address the root cause (stabilize mocks, reset timers, etc.) and link the remediation PR.
- For transient CI failures that re-run cleanly, still log the occurrence so we can spot patterns during quarterly reviews (`metrics-tracker.md`).

---

## 7. Collaboration & Ownership

- Backend leads own the suite but frontend developers may request specific coverage (e.g., for analytics or metric settings). Capture these requests as checklist items or TODOs.
- If a regression escapes to `main`, log an entry in `incidents.md` with root cause, fix, and coverage update.
- Quarterly reviews (aligned with static checks) should inspect:
  - Runtime trends (`metrics-tracker.md`).
  - Coverage deltas compared to the previous quarter.
  - Open checklist items or deferrals.

By following this workflow, contributors can demonstrate production-grade rigor for unit tests while keeping documentation and CI/CD artifacts in sync with the rest of the Lakira testing strategy.
