# Contract Tests – Lakira Backend

## Overview

- **Purpose:** define and enforce the HTTP contracts for every frontend-facing API by combining curated Postman/Newman suites with specification-driven fuzzing (Schemathesis).
- **Owners:** Backend Platform / QA (primary), with FE + DevOps as reviewers.
- **Why now:** Integration tests are stable (see `documents/tests/3-integration-tests/**`). The CI/CD plan (`documents/ci-cd/backend/GITHUB_ACTIONS_PIPELINE_PLAN.md`) identifies contract tests as the next gate before production deployments.

## Scope

- **In scope**
  - Postman collections + Newman scripts that assert success + error responses, headers, and payload schemas for `/analytics`, `/metrics`, `/metric-logs`, `/metric-settings`, and `/auth`.
  - Schemathesis runs against `documents/openapi/lakira-backend-openapi.json` to fuzz contracts and capture unexpected 5xx/validation issues.
  - CI wiring (`contract_local`, `contract_staging` jobs) and artifact retention.
  - Documentation + metrics for runtime, endpoint coverage, and failure triage.
- **Out of scope**
  - Frontend Cypress/Playwright tests (handled in FE repo).
  - Load/perf testing (see `documents/performance/**` when available).
  - Lower-level behaviour already covered by unit/integration suites.

## Commands & Tooling

- `npm run test:contract:local` – seeds deterministic data (unless `SKIP_CONTRACT_SEED=true`) and runs all Newman collections against the locally running backend using `documents/tests/4-contract-tests/postman-newman/environments/lakira-local.postman_environment.json`.
- `npm run test:contract:staging` – runs the same collections against staging using secrets injected via `STAGING_*` environment variables.
- `npm run test:contract:schemathesis:local` – runs Schemathesis against the generated OpenAPI file using `SCHEMATHESIS_LOCAL_TOKEN` from `tmp/contract-seed.json` (override `SCHEMATHESIS_LOCAL_BASE_URL=http://localhost:8002/api/v1` when booting via `.env.test`).
- `npm run test:contract:schemathesis:staging` – Schemathesis fuzzing pointed at staging; requires `SCHEMATHESIS_STAGING_BASE_URL` + `SCHEMATHESIS_STAGING_TOKEN`.
- Scripts will live under `documents/tests/4-contract-tests/postman-newman/scripts/` and `documents/tests/4-contract-tests/schemathesis/scripts/`.
- Install Schemathesis via `python -m venv .venv && source .venv/bin/activate && pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt` (see the Schemathesis README for Windows commands).
- Reports:
  - `documents/tests/4-contract-tests/postman-newman/reports/local|staging`.
  - `documents/tests/4-contract-tests/schemathesis/reports/local|staging` (per-run folders with `.xml` + `.har` reports).

## Environment & Data

- Local + CI rely on `.env.test` plus dedicated contract-test seeds to provision:
  - Auth tokens (`CONTRACT_TEST_USER_TOKEN`, etc.).
  - Stable IDs for metrics/settings/logs (document in env JSON files).
- Set `DISABLE_RATE_LIMITING=true` when running Schemathesis/Newman locally so the global limiter does not emit 429s during contract fuzzing (see `.env.test`); keep it `false` elsewhere.
- After running `npm run seed:contract-tests`, the Newman runner automatically loads the latest `primaryUser.token` from `tmp/contract-seed.json` and injects it into the runtime environment (you only need to copy it manually if you’re running collections from the Postman UI).
- Generated JWTs expire every 7 days; rerun the seed command to refresh `tmp/contract-seed.json` before contract tests so a fresh token is available for the automation layer.
- Staging credentials must be injected via GitHub secrets and _not_ stored in JSON. Use Newman `--env-var` overrides and set `SCHEMATHESIS_STAGING_*` variables at runtime.
- Seeding scripts are owned by the backend repo (see `scripts/seed-contract-tests.ts` invoked via `npm run seed:contract-tests`).

## Verification Workflow

1. Run `npm run db:migrate:test` (or `scripts/test-ci.sh`) to ensure schema parity.
2. Start backend locally (`npm run start:test` or Docker Compose).
3. Execute `npm run test:contract:local`. Confirm reports generated and no assertions failed.
4. (After staging deploy) export the `STAGING_*` secrets listed in `postman-newman/README.md` (base URL, tokens, seeded IDs), then run `npm run test:contract:staging`.
5. For Schemathesis, ensure OpenAPI spec is regenerated (`npm run docs:openapi:generate`) before executing fuzzing commands, start the API via `NODE_ENV=development npx dotenv -e .env.test -- tsx ./src/server.ts`, and confirm `DISABLE_RATE_LIMITING=true` so the test database listens on port 8002 without throttling.
6. In GitHub Actions, configure branch protection for `main`/`develop` so the `contract_local` job is a required status check (see `documents/ci-cd/backend/README.md` §7). This prevents merges when contract tests or Schemathesis finds regressions.

CI/CD expectations:

- `contract_local` runs post-integration tests, spinning up the backend inside the job.
- `deploy_staging` triggers Render deploy + waits for health.
- `contract_staging` consumes staging URL + Newman env, storing artifacts for reviewers.
- Schemathesis jobs can run nightly or on `main` once Phase 2 completes (see plan).

### Staging secrets & rotation (CI)

| Secret name                                                                          | Used by                           | Purpose                                                                                                    | Rotation guidance                                                                                                             |
| ------------------------------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `STAGING_BASE_URL`                                                                   | `contract_staging` + Schemathesis | HTTPS base URL for the Render staging API (`https://…/api/v1`).                                            | Update whenever the Render service URL changes.                                                                               |
| `STAGING_CONTRACT_TOKEN`                                                             | `contract_staging`                | JWT for the seeded staging primary user.                                                                   | Regenerate via the service-account flow or `seed-contract-tests` equivalent against staging data; tokens expire every 7 days. |
| `STAGING_CONTRACT_USER_ID`                                                           | `contract_staging`                | Primary seeded user ID.                                                                                    | Keep deterministic (see `seed-strategy.md`). Update secret only if staging data is recreated.                                 |
| `STAGING_CONTRACT_SECONDARY_USER_ID`                                                 | `contract_staging`                | Secondary seeded user ID for cross-user tests.                                                             | Same as above.                                                                                                                |
| `STAGING_CATEGORY_REVENUE_ID` / `STAGING_CATEGORY_PRODUCTIVITY_ID`                   | `contract_staging`                | Category IDs referenced by analytics + metrics suites.                                                     | Re-seed staging with the deterministic IDs; rotate secret if IDs change.                                                      |
| `STAGING_METRIC_REVENUE_ID` / `STAGING_METRIC_PRODUCTIVITY_ID`                       | `contract_staging`                | Metric IDs for happy-path + conditional requests.                                                          | Keep aligned with staging dataset.                                                                                            |
| `STAGING_METRIC_SETTINGS_REVENUE_ID` / `STAGING_METRIC_SETTINGS_PRODUCTIVITY_ID`     | `contract_staging`                | Metric settings IDs for configuration assertions.                                                          | Update only when staging fixtures change.                                                                                     |
| `STAGING_METRIC_LOG_REVENUE_LATEST_ID` / `STAGING_METRIC_LOG_PRODUCTIVITY_LATEST_ID` | `contract_staging`                | Latest log IDs seeded for analytics cache/ETag flows.                                                      | Refresh via staging seed routine.                                                                                             |
| `SCHEMATHESIS_STAGING_BASE_URL`                                                      | Schemathesis staging run          | Same as `STAGING_BASE_URL` but consumed by Schemathesis wrappers.                                          | Keep in sync with Render URL.                                                                                                 |
| `SCHEMATHESIS_STAGING_TOKEN`                                                         | Schemathesis staging run          | JWT for fuzzing requests (separate from Newman token if using a service account with relaxed rate limits). | Rotate alongside `STAGING_CONTRACT_TOKEN`; store a token that bypasses rate limiting when possible.                           |

> Rotation runbook: whenever staging data drifts or tokens expire, re-run the deterministic seed routine against the staging database (see `seed-strategy.md` for ID mapping), capture the resulting IDs/tokens, and update the secrets above in GitHub Actions. Record the rotation date + owner in `incidents.md` or `metrics-tracker.md` if it impacts test reliability.

## References

- [Plan](./contract-tests-plan.md)
- [Checklist](./contract-tests-checklist.md)
- [Ticket](./contract-tests-ticket.md)
- [Decisions](./decisions.md)
- [Incidents](./incidents.md)
- [Metrics Tracker](./metrics-tracker.md)
- Postman/Newman docs:
  - [README](./postman-newman/README.md)
  - [Plan](./postman-newman/PLAN.md)
  - [Checklist](./postman-newman/CHECKLIST.md)
  - [Workflow Guidelines](./postman-newman/WORKFLOW_GUIDELINES.md)
  - [Pipeline Overview](./postman-newman/PIPELINE_OVERVIEW.md)
- [Seed Strategy](./seed-strategy.md)
- Schemathesis docs:
  - [README](./schemathesis/README.md)
  - [Plan](./schemathesis/PLAN.md)
  - [Checklist](./schemathesis/CHECKLIST.md)
  - [Findings Log](./schemathesis/findings.md)
- CI/CD alignment: `documents/ci-cd/backend/GITHUB_ACTIONS_PIPELINE_PLAN.md`
- `npm run seed:contract-tests` – resets deterministic contract data (users/categories/metrics/logs) and writes outputs to `tmp/contract-seed.json` for Postman environment variables.
