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
- `npm run test:contract:schemathesis:local` _(planned)_ – invokes Schemathesis with the local OpenAPI file and base URL.
- `npm run test:contract:schemathesis:staging` _(planned)_ – Schemathesis against staging.
- Scripts will live under `documents/tests/4-contract-tests/postman-newman/scripts/` and `documents/tests/4-contract-tests/schemathesis/scripts/`.
- Reports:
  - `documents/tests/4-contract-tests/postman-newman/reports/local|staging`.
  - `documents/tests/4-contract-tests/schemathesis/reports/local|staging`.

## Environment & Data

- Local + CI rely on `.env.test` plus dedicated contract-test seeds to provision:
  - Auth tokens (`CONTRACT_TEST_USER_TOKEN`, etc.).
  - Stable IDs for metrics/settings/logs (document in env JSON files).
- After running `npm run seed:contract-tests`, copy the latest `primaryUser.token` value from `tmp/contract-seed.json` into `documents/tests/4-contract-tests/postman-newman/environments/lakira-local.postman_environment.json`.
- Generated JWTs expire every 7 days; rerun the seed command before local Newman runs to refresh `contractAuthToken`.
- Staging credentials must be injected via GitHub secrets and _not_ stored in JSON. Use Newman/Schemathesis `--env-var` overrides to pass tokens at runtime.
- Seeding scripts are owned by the backend repo (see `scripts/seed-contract-tests.ts` invoked via `npm run seed:contract-tests`).

## Verification Workflow

1. Run `npm run db:migrate:test` (or `scripts/test-ci.sh`) to ensure schema parity.
2. Start backend locally (`npm run start:test` or Docker Compose).
3. Execute `npm run test:contract:local`. Confirm reports generated and no assertions failed.
4. (After staging deploy) export the `STAGING_*` secrets listed in `postman-newman/README.md` (base URL, tokens, seeded IDs), then run `npm run test:contract:staging`.
5. For Schemathesis, ensure OpenAPI spec is regenerated (`npm run docs:openapi:generate`) before executing fuzzing commands.

CI/CD expectations:

- `contract_local` runs post-integration tests, spinning up the backend inside the job.
- `deploy_staging` triggers Render deploy + waits for health.
- `contract_staging` consumes staging URL + Newman env, storing artifacts for reviewers.
- Schemathesis jobs can run nightly or on `main` once Phase 2 completes (see plan).

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
- Schemathesis docs (to be populated in this milestone):
  - [Plan](./schemathesis/PLAN.md)
  - [Checklist](./schemathesis/CHECKLIST.md)
- CI/CD alignment: `documents/ci-cd/backend/GITHUB_ACTIONS_PIPELINE_PLAN.md`
- `npm run seed:contract-tests` – resets deterministic contract data (users/categories/metrics/logs) and writes outputs to `tmp/contract-seed.json` for Postman environment variables.
