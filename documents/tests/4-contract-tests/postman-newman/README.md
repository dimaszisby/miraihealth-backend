# Postman / Newman Contract Tests – Lakira Backend

## 1. Overview

This folder contains the **API contract test suite** for the Lakira Backend, implemented using **Postman collections** and executed via **Newman**.

Contract tests verify that the **runtime behaviour** of backend APIs (status codes, payload shapes, and critical headers such as caching/ETag) remains consistent with the **documented API contract** (OpenAPI + feature docs).  
They act as a guardrail between:

- The **Lakira backend** (Express + Sequelize + PostgreSQL).
- The **Lakira frontend** (Next.js) and any other external consumers.

This suite covers the **core FE-facing APIs**:

- Analytics
- Metrics
- Metric Logs
- Metric Settings
- Auth

and is especially important for **analytics/dashboard** where small schema or caching changes can cause large UI regressions.

---

## 2. Goals

- Ensure **client-facing APIs** conform to the OpenAPI contract and feature documentation.
- Detect breaking changes early (status codes, response body structure, header changes).
- Provide a **reproducible test harness** FE can trust as a baseline before implementing or refactoring features.
- Integrate into **CI/CD** so contract regressions block merges to protected branches.
- Serve as a **living reference** of how the backend is expected to behave at the HTTP boundary.
- Cover both happy-path and guardrail scenarios (validation/auth/not-found) using deterministic seed data so failures are reproducible.

> Special Note for Codex: When asked to “validate API contract” or “check analytics/metrics endpoints,” treat this folder (and its collections) as the primary reference for Postman/Newman-based contract testing.

---

## 3. Scope & Non-Goals

### 3.1 In Scope

- All **externally-consumed backend endpoints** defined in `lakira-backend-openapi.json` for:
  - Analytics (`/analytics/**`)
  - Metrics (`/metrics/**`)
  - Metric Logs (`/metric-logs/**`)
  - Metric Settings (`/metric-settings/**`)
  - Auth (`/auth/**`)
- Verification of:
  - HTTP methods, paths, and query/route parameters.
  - Status codes for success and error scenarios.
  - Response body shape and essential fields (aligned with OpenAPI schemas).
  - Important headers (e.g. `Content-Type`, `ETag`, `Cache-Control`).
  - Error response schema for common errors (`400`, `401`, `403`, `404`, `500`).

### 3.2 Out of Scope

- Deep business logic correctness (covered by unit/integration tests).
- Performance and load (covered by separate performance / web-vitals plans).
- Frontend integration and UI flows (covered by FE integration/E2E tests).
- Database internals and migrations (covered by schema / migration tests).

---

## 4. Prerequisites

To run these tests locally, you need:

- Node.js and npm (or yarn) installed.
- Newman installed (either globally or as a devDependency), for example:

  ```bash
  npm install --save-dev newman
  ```

## 5. Folder Layout

```
documents/tests/4-contract-tests/postman-newman/
├── collections/      # Postman collections (one per feature domain)
├── environments/     # Local & staging env files (non-secret placeholders)
├── scripts/          # Node helpers invoked by npm scripts (local/staging)
├── reports/          # Newman CLI, HTML, and JUnit outputs per env
├── README.md         # This file
├── PLAN.md           # Coverage + scenario blueprint
├── CHECKLIST.md      # Execution tracker
├── WORKFLOW_GUIDELINES.md
└── PIPELINE_OVERVIEW.md
```

Collections + environment files are version-controlled; secrets (tokens, passwords) must be provided via CI secrets or local `.env` values at runtime.

## 6. Local Execution Workflow

1. **Start backend + dependencies**
   - Use Docker Compose or `npm run start:test`.
   - Keep Postgres/Redis aligned with `.env.test`.
2. **Run the automated script**

   ```bash
   npm run test:contract:local
   # internally calls node documents/tests/4-contract-tests/postman-newman/scripts/run-contract-local.js
   ```

   - The script runs `npm run seed:contract-tests` (unless `SKIP_CONTRACT_SEED=true`), then executes every collection with the local environment file.

3. **Inspect reports**
   - CLI output appears in the terminal.
   - HTML + JUnit saved to `documents/tests/4-contract-tests/postman-newman/reports/local/<timestamp>/`.
4. **Update documentation**
   - Log runtime + coverage deltas in `metrics-tracker.md`.
   - Update checklist items when new scenarios are added.
5. **Refresh tokens when necessary**
   - Rerun `npm run seed:contract-tests` whenever the JWT expires (7-day TTL). The runner automatically reads `tmp/contract-seed.json` and injects `contractAuthToken` at runtime (override via `CONTRACT_AUTH_TOKEN` if you need a custom token).

## 7. Staging / CI Execution

- `npm run test:contract:staging` runs the same collections against the staging base URL.
- `scripts/run-contract-staging.js` reads GitHub Actions secrets and overrides `lakira-staging.postman_environment.json` at runtime. Required env vars:
  - `STAGING_BASE_URL`
  - `STAGING_CONTRACT_TOKEN`
  - `STAGING_CONTRACT_USER_ID`
  - `STAGING_CONTRACT_SECONDARY_USER_ID`
  - `STAGING_CATEGORY_REVENUE_ID`
  - `STAGING_CATEGORY_PRODUCTIVITY_ID`
  - `STAGING_METRIC_REVENUE_ID`
  - `STAGING_METRIC_PRODUCTIVITY_ID`
  - `STAGING_METRIC_SETTINGS_REVENUE_ID`
  - `STAGING_METRIC_SETTINGS_PRODUCTIVITY_ID`
  - `STAGING_METRIC_LOG_REVENUE_LATEST_ID`
  - `STAGING_METRIC_LOG_PRODUCTIVITY_LATEST_ID`
- Reports land under `documents/tests/4-contract-tests/postman-newman/reports/staging/<timestamp>/` and should be uploaded as CI artifacts (see pipeline plan).
- The CI `contract_staging` job (Phase 3) must depend on the staging deploy job to ensure the latest code is under test.
- Refer to [`STAGING_RUNBOOK.md`](./STAGING_RUNBOOK.md) for deploy-hook prerequisites, secret rotation guidance, and manual reproduction steps when staging runs fail.

## 8. Assertions & Reporting

- Follow `PLAN.md` + `CHECKLIST.md` for endpoint coverage and scenario expectations.
- Minimum assertions per request:
  - Status code.
  - `Content-Type`.
  - Headers specific to analytics caching (ETag, Cache-Control).
  - Body fields and types (consider using JSON schema snippets stored under `collections/schemas/` if needed).
- Enable Newman reporters: `cli`, `html`, `junit`.
- The runner scripts already configure the reporters and export paths:
  ```bash
  newman run <collection> \
    -e <environment> \
    --reporters cli,html,junit \
    --reporter-html-export reports/<env>/<timestamp>/<collection>.html \
    --reporter-junit-export reports/<env>/<timestamp>/<collection>.xml
  ```

## 9. Troubleshooting & Tips

- **Auth failures:** Re-run the contract seed script to regenerate tokens or update environment variables.
- **Flaky analytics ETag tests:** Ensure Redis/cache is enabled and seeds include historical logs; use `ENABLE_REDIS_INTEGRATION=true` when running backend locally.
- **Schema mismatches:** Regenerate OpenAPI spec and verify backend DTOs; update Postman assertions + Schemathesis plan accordingly.
- **Performance issues:** Split collections across multiple Newman runs or leverage `--delay-request` sparingly; document changes in PLAN and CI docs.
- **Conditional requests skipped:** Run the primary analytics dashboard + visualization happy-path requests first so the `analyticsDashboardEtag` / `analyticsMetricEtag` variables are populated before the 304 scenarios.

## 10. References

- [Contract Tests Plan](../contract-tests-plan.md)
- [Postman Plan](./PLAN.md)
- [Postman Checklist](./CHECKLIST.md)
- [Workflow Guidelines](./WORKFLOW_GUIDELINES.md)
- [Pipeline Overview](./PIPELINE_OVERVIEW.md)
- [Schemathesis Plan](../schemathesis/PLAN.md) — for complementary fuzzing strategy
- [Staging Contract Runbook](./STAGING_RUNBOOK.md)

## 11. Runtime Variables

- The collections set transient environment variables so follow-up requests can reference created records:
  - `contractCreatedMetricId` / `contractCreatedMetricName`
  - `contractCreatedMetricLogId`
  - `contractLoggedInUserId`
- Analytics tests also use:
  - `analyticsDashboardEtag`
  - `analyticsMetricEtag`
- These are cleared at the end of their respective flows, but rerun `npm run seed:contract-tests` whenever you want to reset the backing data (JWTs expire every 7 days).
