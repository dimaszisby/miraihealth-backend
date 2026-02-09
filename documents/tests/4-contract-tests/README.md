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
- `npm run test:contract:schemathesis:local` – runs Schemathesis against the generated OpenAPI file using `SCHEMATHESIS_LOCAL_TOKEN` from `tmp/contract-seed.json`.
- `npm run test:contract:schemathesis:local:quick` – fast local smoke loop (`examples` only).
- `npm run test:contract:schemathesis:local:gate` – PR-like depth (`examples,coverage,fuzzing`).
- `npm run test:contract:schemathesis:local:full` – deepest deterministic local depth (`mode=positive`, `examples,coverage,fuzzing,stateful`).
- `npm run test:contract:schemathesis:local:exploratory` – non-blocking noisy depth (`mode=all`) for explicit negative-case exploration.
- `npm run test:contract:schemathesis:staging` – Schemathesis fuzzing pointed at staging; requires `SCHEMATHESIS_STAGING_BASE_URL` + `SCHEMATHESIS_STAGING_TOKEN`.
- `npm run contract:local:quick` – orchestrated local run (build/migrate/seed/start + Newman + Schemathesis quick profile).
- `npm run contract:local:gate` – orchestrated local run with gate profile.
- `npm run contract:local:full` – orchestrated local run with full profile. Preferred for parity with CI deep checks.
- `npm run contract:local:exploratory` – orchestrated local run with exploratory profile (`mode=all`) for opt-in deep fuzzing.
- All orchestration scripts default to `PORT=4000` for parity with GitHub Actions; override via `CONTRACT_LOCAL_PORT=8002 npm run contract:local:quick` if needed (the helper propagates the same port to wait-on probes and Schemathesis base URL). The helper auto-detects `.venv-schemathesis/bin/schemathesis` (or uses `SCHEMATHESIS_CLI` if you set one), so run the Python virtualenv installation once before invoking it.
- Scripts will live under `documents/tests/4-contract-tests/postman-newman/scripts/` and `documents/tests/4-contract-tests/schemathesis/scripts/`.
- Install Schemathesis via `python -m venv .venv && source .venv/bin/activate && pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt` (see the Schemathesis README for Windows commands).
- Reports:
  - `documents/tests/4-contract-tests/postman-newman/reports/local|staging`.
  - `documents/tests/4-contract-tests/schemathesis/reports/local|staging` (per-run folders with `.xml` + `.har` reports).

### Schemathesis local quickstart

1. **Install / activate the CLI once**
   ```bash
   python3 -m venv .venv-schemathesis
   source .venv-schemathesis/bin/activate    # Windows: .venv-schemathesis\Scripts\activate
   pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt
   ```
2. **Regenerate the OpenAPI spec + seed deterministic data**
   ```bash
   npm run docs:openapi:generate
   npm run seed:contract-tests
   ```
3. **Export the Schemathesis JWT + base URL (re-run this after every seed)**
   ```bash
   export SCHEMATHESIS_LOCAL_TOKEN=$(node -e 'const seed=require("./tmp/contract-seed.json"); if(!seed?.primaryUser?.token) process.exit(1); process.stdout.write(seed.primaryUser.token);')
   export SCHEMATHESIS_LOCAL_BASE_URL=${SCHEMATHESIS_LOCAL_BASE_URL:-http://localhost:4000/api/v1}
   ```
4. **Start the API with throttling disabled (if not using `npm run contract:local:full`)**
   ```bash
   DISABLE_RATE_LIMITING=true ALLOW_TEST_HTTP_SERVER=true npm run start:test
   ```
5. **Run Schemathesis locally**
   ```bash
   npm run test:contract:schemathesis:local:quick
   ```
   Reports land under `documents/tests/4-contract-tests/schemathesis/reports/local/<timestamp>/`.

### Local profile recommendations

- Day-to-day local development: `npm run contract:local:quick`
- Pre-push / pre-PR confidence: `npm run contract:local:gate`
- Deep deterministic debugging / release confidence: `npm run contract:local:full`
- Optional negative-case exploration: `npm run contract:local:exploratory`
- `quick` is fail-fast by default (`SCHEMATHESIS_LOCAL_MODE=positive`, `SCHEMATHESIS_LOCAL_WORKERS=2`, `SCHEMATHESIS_LOCAL_MAX_FAILURES=10`, `SCHEMATHESIS_LOCAL_SUPPRESS_HEALTH_CHECKS=too_slow,filter_too_much`).
- `gate` is bounded for local use (`SCHEMATHESIS_LOCAL_MODE=positive`, `SCHEMATHESIS_LOCAL_WORKERS=2`, `SCHEMATHESIS_LOCAL_MAX_EXAMPLES=15`, `SCHEMATHESIS_LOCAL_MAX_FAILURES=15`, `SCHEMATHESIS_LOCAL_SUPPRESS_HEALTH_CHECKS=too_slow,filter_too_much`) so coverage/fuzzing remains practical on laptops.
- `full` remains positive-mode but deeper (`stateful`, `workers=4`, `max-examples=50`, `max-failures=30`), while `exploratory` keeps `mode=all` for non-blocking deep fuzzing.

You can also force profile selection directly with:

```bash
SCHEMATHESIS_LOCAL_PROFILE=quick npm run test:contract:schemathesis:local
```

## Environment & Data

- Local + CI rely on `.env.test` plus dedicated contract-test seeds to provision:
  - Auth tokens (`CONTRACT_TEST_USER_TOKEN`, etc.).
  - Stable IDs for metrics/settings/logs (document in env JSON files).
- Set `DISABLE_RATE_LIMITING=true` when running Schemathesis/Newman locally so the global limiter does not emit 429s during contract fuzzing (see `.env.test`); keep it `false` elsewhere.
- After running `npm run seed:contract-tests`, the Newman runner automatically loads the latest `primaryUser.token` from `tmp/contract-seed.json` and injects it into the runtime environment (you only need to copy it manually if you’re running collections from the Postman UI).
- All `POST /metric-logs` requests must include an explicit `type` (`"manual"` or `"automatic"`). The backend no longer defaults this value during validation so that contract tests can assert correct error handling for malformed payloads.
- UUID validation now uses assertion-level constraints (`format` + strict UUID `pattern`) in shared Zod/OpenAPI schemas. This avoids OpenAPI 3.1 `format`-only ambiguity where generators may treat empty strings as schema-compliant.
- POST/PUT/PATCH endpoints that accept request bodies expect JSON objects — sending a bare string/number/`null` now returns a `400` via the shared guard middleware. When fuzzing with Schemathesis, prefer `{}` as a starting point if you want to probe “empty object” behaviour. (`PATCH /metric-settings/{id}/achieve` does **not** take a body.)
- `PUT /metrics/{id}` requires at least one **recognized** update field; empty or unknown-only payloads return `400` (unknown keys are rejected to avoid no-op updates).
- Metric settings creation/update enforces the domain invariant: when `goalEnabled=true`, both `goalType` and `goalValue` must be provided (and the OpenAPI schema documents this via `oneOf`). The same applies to `timeFrameEnabled`; include `startDate` + `deadlineDate` when enabling the time frame, and updates that provide dates without `timeFrameEnabled` will treat the time frame as enabled for that request.
- `PUT /metric-settings/{id}` also requires at least one **recognized** update field; defaults are not injected on partial updates to avoid unintended changes (unknown keys are rejected).
- `GET /metric-settings/{id}` is path-ID driven; `metricId` is **not** a required query parameter for this endpoint.
- `GET /metrics/{metricId}/trends` currently validates only the path `metricId`; `startDate/endDate/interval` query parameters are not part of the enforced contract.
- `PATCH /metric-settings/{id}/display` now requires a `displayOptions` object with at least one explicit field (empty `{}` is rejected).
- Cursor-style queries (`/metrics`, `/metric-logs`, `/metric-settings`, `/metric-categories`) strip/trim `q`, reject empty search strings, and disallow unexpected `filter[...]` keys. Schemathesis will see deterministic `400`s for malformed params; treat those as expected rather than bugs.
- When Schemathesis needs existing IDs (e.g., to avoid 404s), prefer pulling them from `tmp/contract-seed.json` after `npm run seed:contract-tests` and pass them via environment variables or `--header "x-contract-metric-id: …"` helpers. This keeps fuzzing reproducible.
- The seed output now includes `deletable` ID pools for destructive operations (metrics/categories/settings/logs). The Schemathesis hook consumes these for `DELETE` calls to avoid wiping primary fixtures and skips delete cases once the pool is exhausted. The log pool is intentionally large to keep stateful fuzzing deterministic.
- The Schemathesis hook in `documents/tests/contract_hooks/seeded_ids.py` normalizes analytics ranges, clamps `last` windows to safe bucket sizes, forces valid IANA `tz` values (falls back to `UTC` when invalid), injects valid login credentials for positive `/auth/login` cases, and skips negative `/auth/register` cases to avoid generator false positives. Analytics normalization applies to **positive** cases only so schema-violating inputs still exercise rejection paths; keep these overrides aligned with API validation rules.
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

## Troubleshooting

- **Schemathesis immediately reports “Connection refused”** – the backend isn’t running or is bound to a different port. Use `npm run contract:local:full` (which starts the API on `PORT=4000` by default and waits for `/api/v1/health`) or manually run `PORT=4000 DISABLE_RATE_LIMITING=true npm run start:test` in another terminal before invoking the suites.
- **Helper says "Schemathesis CLI not found"** – install the CLI once via `python3 -m venv .venv-schemathesis && source .venv-schemathesis/bin/activate && pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt`, or set `SCHEMATHESIS_CLI` to point at an existing Schemathesis binary before running the helper.
- **Need to inspect backend output** – the orchestration script writes server logs to `tmp/backend-contract.log`. Tail this file after a failure to see stack traces.
- **Token missing** – rerun `npm run seed:contract-tests`; the helper automatically injects the token into Newman/Schemathesis, but manual runs still require exporting `SCHEMATHESIS_LOCAL_TOKEN` from `tmp/contract-seed.json`.
- **“Internal Server Error” when sending raw strings/numbers** – Express now accepts primitive JSON (to let Schemathesis fuzzers through) but every write endpoint enforces `requireJsonObjectBody`. If the payload isn’t an object, you’ll receive a deterministic `400` with `field: "body"` rather than a 500. Fix the client payload instead of retrying.
- **Analytics fuzzing keeps failing with “tz must be a valid IANA zone / end must be after start”** – every visualization request must carry a valid time window. Supply either both `start` + `end` ISO timestamps **or** rely on the `last` parameter (defaults to `30d`, minimum `1`); do not send `last` alongside `start/end`. Large ranges can be rejected based on bucket size. Do not send blank `tz`; omit it to use the default (Asia/Jakarta).
