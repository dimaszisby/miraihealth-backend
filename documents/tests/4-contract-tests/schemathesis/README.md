# Schemathesis Contract Tests – Lakira Backend

This guide explains how to install Schemathesis, run the local/staging fuzzing commands, and interpret the generated artifacts. Use it together with the [plan](./PLAN.md) and [checklist](./CHECKLIST.md).

## 1. Installation

Schemathesis is a Python CLI. Use a virtual environment so Node dependencies stay untouched.

```bash
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\\Scripts\\activate
pip install --upgrade pip
pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt
```

> The requirements file pins Schemathesis for reproducibility. When upgrading the CLI, update the version there and re-run `pip install -r ...`.

## 2. Prerequisites

1. **Deterministic seed data** – `npm run seed:contract-tests` populates users/categories/metrics/logs and writes tokens to `tmp/contract-seed.json`.
2. **Fresh OpenAPI spec** – run `npm run docs:openapi:generate` to refresh `documents/openapi/lakira-backend-openapi.json`.
3. **Backend availability** – start the API before running Schemathesis. Because the server intentionally skips booting when `NODE_ENV=test`, run it with `.env.test` loaded but `NODE_ENV=development`:

   ```bash
   NODE_ENV=development npx dotenv -e .env.test -- tsx ./src/server.ts
   ```

   Wait for `[SERVER] Lakira backend running on port 8002` (default test port) before executing Schemathesis, then stop the process via `Ctrl+C` afterward.

4. **Rate limiter toggle** – `.env.test` sets `DISABLE_RATE_LIMITING=true` so Schemathesis/Newman can exercise endpoints without tripping the global/user/analytics throttles. Keep this `false` in other environments.
5. **Python virtualenv active** – ensures the Schemathesis binary referenced by the runner scripts is discoverable.

## 3. Commands

- `npm run test:contract:schemathesis:local`
  - Reads `SCHEMATHESIS_LOCAL_TOKEN` (JWT from `tmp/contract-seed.json`).
  - Optional overrides: `SCHEMATHESIS_LOCAL_BASE_URL` (defaults to `http://localhost:4000/api/v1`, so override to `http://localhost:8002/api/v1` when following the `.env.test` workflow above), `SCHEMATHESIS_LOCAL_ENDPOINT_TAGS`, `SCHEMATHESIS_LOCAL_ENDPOINTS`, `SCHEMATHESIS_LOCAL_WORKERS`, `SCHEMATHESIS_LOCAL_MAX_EXAMPLES`, `SCHEMATHESIS_LOCAL_PHASES`.
  - Output: `documents/tests/4-contract-tests/schemathesis/reports/local/<timestamp>/{schemathesis-local.xml,schemathesis-local.har}`.
- `npm run test:contract:schemathesis:staging`
  - Requires `SCHEMATHESIS_STAGING_BASE_URL` (e.g., `https://api-staging.lakira.app/api/v1`) and `SCHEMATHESIS_STAGING_TOKEN` (service account JWT).
  - Optional overrides: `SCHEMATHESIS_STAGING_ENDPOINT_TAGS`, `SCHEMATHESIS_STAGING_ENDPOINTS`, `SCHEMATHESIS_STAGING_WORKERS`, `SCHEMATHESIS_STAGING_MAX_EXAMPLES`, `SCHEMATHESIS_STAGING_PHASES`.
  - Output: `documents/tests/4-contract-tests/schemathesis/reports/staging/<timestamp>/{schemathesis-staging.xml,schemathesis-staging.har}`.

Both scripts validate the OpenAPI file exists before invoking Schemathesis and print the full argument list so runs can be reproduced manually if needed.

### Environment Variable Reference

| Variable                             | Purpose                                                                       | Example / Default                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `SCHEMATHESIS_CLI`                   | Path to the Schemathesis binary (defaults to `schemathesis` in current venv). | `.venv/bin/schemathesis`                                                      |
| `SCHEMATHESIS_LOCAL_BASE_URL`        | Override local base URL.                                                      | `http://localhost:8002/api/v1`                                                |
| `SCHEMATHESIS_LOCAL_TOKEN`           | JWT for seeded primary user. **Required** for local runs.                     | `eyJhbGciOiJIUzI1...`                                                         |
| `SCHEMATHESIS_LOCAL_ENDPOINT_TAGS`   | Comma-separated OpenAPI tags to fuzz locally.                                 | `Auth,Analytics,Metrics,Metric Logs,Metric Settings,Metric Categories,Trends` |
| `SCHEMATHESIS_LOCAL_ENDPOINTS`       | Optional comma-separated list of specific operationIds/paths to target.       | `getMetricsId`                                                                |
| `SCHEMATHESIS_LOCAL_WORKERS`         | Worker pool size for local runs.                                              | `auto`                                                                        |
| `SCHEMATHESIS_LOCAL_MAX_EXAMPLES`    | Hypothesis example limit per endpoint.                                        | `50`                                                                          |
| `SCHEMATHESIS_LOCAL_PHASES`          | Override the ordered list of phases to run.                                   | `examples,coverage,fuzzing,stateful`                                          |
| `SCHEMATHESIS_STAGING_BASE_URL`      | HTTPS base URL for staging backend. **Required** for staging runs.            | `https://lakira-backend-stg.onrender.com`                                     |
| `SCHEMATHESIS_STAGING_TOKEN`         | Long-lived staging JWT. **Required**.                                         | `eyJhbGciOiJIUzI1...`                                                         |
| `SCHEMATHESIS_STAGING_ENDPOINT_TAGS` | Tag override for staging runs.                                                | Same as local                                                                 |
| `SCHEMATHESIS_STAGING_ENDPOINTS`     | Restrict staging run to specific endpoints during debugging.                  | `getAnalyticsDashboard`                                                       |
| `SCHEMATHESIS_STAGING_WORKERS`       | Worker pool size for staging (set explicitly in CI to avoid resource thrash). | `4`                                                                           |
| `SCHEMATHESIS_STAGING_MAX_EXAMPLES`  | Hypothesis example limit for staging runs.                                    | `50`                                                                          |
| `SCHEMATHESIS_STAGING_PHASES`        | Override the phases list for staging runs.                                    | `examples,coverage,fuzzing,stateful`                                          |

## 4. Reports & Artifacts

- HAR (JSON) plus JUnit XML reports capture full interaction history + CI-friendly summaries for each run.
- Store both under `schemathesis/reports/<env>/<timestamp>/` (already handled by the runner scripts). Upload entire folders as artifacts in CI jobs.
- When failures occur, keep the JSON report path handy and paste into `documents/tests/4-contract-tests/incidents.md` so investigators can replay the issue.

## 5. Troubleshooting

- **`schemathesis: command not found`** – ensure your Python virtualenv is activated or set `SCHEMATHESIS_CLI` to the binary path.
- **`OpenAPI spec not found`** – run `npm run docs:openapi:generate`; runners bail out early if the JSON is missing to avoid stale results.
- **401 responses** – regenerate the seed (`npm run seed:contract-tests`) and export the new `SCHEMATHESIS_LOCAL_TOKEN`. For staging, rotate the service account JWT and update GitHub secrets.
- **Burst of 429 failures** – the global rate limiter applies even to contract runs. Set `DISABLE_RATE_LIMITING=true` (as in `.env.test`) or whitelist the Schemathesis service account before rerunning.
- **Random 404s / invalid IDs** – confirm `--stateful=links` is enabled (default) and that the OpenAPI spec includes the correct `operationId` relationships. If any endpoints require manual setup, document them in the plan + checklist.
- **Slow runs** – tune `SCHEMATHESIS_*_MAX_EXAMPLES` or split the tag list (e.g., analytics vs metrics) while keeping the ≥90% coverage target outlined in the metrics tracker.

## 6. Next Steps

- Triage the first local fuzzing run (2026-01-14) — 112 failures logged under `schemathesis/reports/local/2026-01-14T08-19-10-426Z/` and summarized in `metrics-tracker.md` / `incidents.md` (rate limiter + schema drift + missing 405 handlers).
- Review ongoing findings in [`schemathesis/findings.md`](./findings.md) — latest rerun (examples+coverage, limiter disabled) highlights remaining schema/405/test-data gaps.
- Wire the staging command into GitHub Actions (`contract_staging` / nightly job) per the CI/CD plan.
- Extend hooks with caching-header validations once telemetry endpoints settle.
