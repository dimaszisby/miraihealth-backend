# Schemathesis Contract Tests – Lakira Backend

This guide explains how to install Schemathesis, run the local/staging fuzzing commands, and interpret the generated artifacts. Use it together with the [plan](./PLAN.md) and [checklist](./CHECKLIST.md).

## 1. Installation

Schemathesis is a Python CLI. Use a virtual environment so Node dependencies stay untouched.

```bash
python3 -m venv .venv-schemathesis
source .venv-schemathesis/bin/activate            # Windows: .venv-schemathesis\\Scripts\\activate
pip install --upgrade pip
pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt
```

> The requirements file pins Schemathesis for reproducibility. When upgrading the CLI, update the version there and re-run `pip install -r ...`.
> The runners resolve the CLI in this order: `SCHEMATHESIS_CLI` (if set), local `.venv-schemathesis` binary (if present), then `schemathesis` from `PATH`.

## 2. Prerequisites

1. **Deterministic seed data** – `npm run seed:contract-tests` populates users/categories/metrics/logs and writes tokens to `tmp/contract-seed.json`.
2. **Fresh OpenAPI spec** – run `npm run docs:openapi:generate` to refresh `documents/openapi/lakira-backend-openapi.json`.
3. **Backend availability** – start the API before running Schemathesis. Because the server intentionally skips booting when `NODE_ENV=test`, run it with `.env.test` loaded but `NODE_ENV=development`:

   ```bash
   NODE_ENV=development npx dotenv -e .env.test -- tsx ./src/server.ts
   ```

   Wait for `[SERVER] Lakira backend running on port 8002` (default test port) before executing Schemathesis, then stop the process via `Ctrl+C` afterward.

4. **Rate limiter toggle** – `.env.test` sets `DISABLE_RATE_LIMITING=true` so Schemathesis/Newman can exercise endpoints without tripping the global/user/analytics throttles. Keep this `false` in other environments.
5. **Schemathesis CLI available** – either activate the local virtualenv or ensure `schemathesis` is available on `PATH`.

### Local run checklist

Follow these steps every time you fuzz locally:

1. Regenerate the spec + seed deterministic fixtures
   ```bash
   npm run docs:openapi:generate
   npm run seed:contract-tests
   ```
2. Export a fresh JWT + base URL (tokens expire every 7 days)
   ```bash
   export SCHEMATHESIS_LOCAL_TOKEN=$(node -e 'const seed=require("./tmp/contract-seed.json"); if(!seed?.primaryUser?.token) process.exit(1); process.stdout.write(seed.primaryUser.token);')
   export SCHEMATHESIS_LOCAL_BASE_URL=${SCHEMATHESIS_LOCAL_BASE_URL:-http://localhost:4000/api/v1}
   ```
   > When you boot the API via `.env.test`/`npm run start:test`, override the base URL to `http://localhost:8002/api/v1` so Schemathesis points at the same port.
   > The local runner falls back to `tmp/contract-seed.json` automatically when `SCHEMATHESIS_LOCAL_TOKEN` isn't set, but exporting it yourself keeps the process explicit.
3. Start the backend (`DISABLE_RATE_LIMITING=true ALLOW_TEST_HTTP_SERVER=true npm run start:test`) or use `npm run contract:local:full` which handles build → migrate → seed → start → run → teardown automatically.
4. Run `npm run test:contract:schemathesis:local` (or the staging variant) once the health check passes.

## 3. Commands

- `npm run test:contract:schemathesis:local`
  - Reads `SCHEMATHESIS_LOCAL_TOKEN` (JWT from `tmp/contract-seed.json`).
  - Optional overrides: `SCHEMATHESIS_LOCAL_BASE_URL` (defaults to `http://localhost:4000/api/v1`, so override to `http://localhost:8002/api/v1` when following the `.env.test` workflow above), `SCHEMATHESIS_LOCAL_ENDPOINT_TAGS`, `SCHEMATHESIS_LOCAL_ENDPOINTS`, `SCHEMATHESIS_LOCAL_PROFILE`, `SCHEMATHESIS_LOCAL_WORKERS`, `SCHEMATHESIS_LOCAL_MAX_EXAMPLES`, `SCHEMATHESIS_LOCAL_PHASES`, `SCHEMATHESIS_LOCAL_CHECKS`, `SCHEMATHESIS_LOCAL_SUPPRESS_HEALTH_CHECKS`, `SCHEMATHESIS_LOCAL_MAX_FAILURES`, `SCHEMATHESIS_LOCAL_REQUEST_TIMEOUT`, `SCHEMATHESIS_LOCAL_SEED`.
  - Profile presets (`SCHEMATHESIS_LOCAL_PROFILE`) are:
    - `quick`: `mode=positive`, `examples`, `workers=2`, `max-examples=10`, `max-failures=10`, `--suppress-health-check=too_slow,filter_too_much`
    - `gate`: `mode=positive`, `examples,coverage,fuzzing`, `workers=2`, `max-examples=15`, `max-failures=15`, `--suppress-health-check=too_slow,filter_too_much`
    - `full`: `mode=positive`, `examples,coverage,fuzzing,stateful`, `workers=4`, `max-examples=50`, `max-failures=30`, `--suppress-health-check=too_slow,filter_too_much`
    - `exploratory`: `mode=all`, `checks=all`, `examples,coverage,fuzzing,stateful`, `workers=4`, `max-examples=50` (non-blocking noisy deep run)
    - Unknown profile values fall back to `quick`.
  - NPM shortcuts:
    - `npm run test:contract:schemathesis:local:quick`
    - `npm run test:contract:schemathesis:local:gate`
    - `npm run test:contract:schemathesis:local:full`
    - `npm run test:contract:schemathesis:local:exploratory`
  - Automatically loads deterministic IDs from `tmp/contract-seed.json` via `documents/tests/contract_hooks/seeded_ids.py` (wired through `SCHEMATHESIS_HOOKS`) so stateful endpoints (metrics → metric-settings → logs/analytics) reuse real fixtures instead of random UUIDs.
  - The hook also injects seeded login credentials for `/auth/login`, normalizes metric update references (`categoryId`, `originalMetricId`) to valid seeded IDs, and generates unique usernames/emails + metric/category names to avoid false-positive 409 conflicts during fuzzing.
- The runner exports `SCHEMATHESIS_HOOKS=documents.tests.contract_hooks.seeded_ids` and prepends the repo root to `PYTHONPATH` so Schemathesis can import the hook module.
  - When running Schemathesis manually with a module path (`documents.tests.contract_hooks.seeded_ids`), ensure `documents/__init__.py` and `documents/tests/__init__.py` exist so the package resolves.
  - Output: `documents/tests/4-contract-tests/schemathesis/reports/local/<timestamp>/{schemathesis-local.xml,schemathesis-local.har}`.
- `npm run test:contract:schemathesis:staging`
  - Requires `SCHEMATHESIS_STAGING_BASE_URL` (e.g., `https://api-staging.lakira.app/api/v1`) and `SCHEMATHESIS_STAGING_TOKEN` (service account JWT).
  - Optional overrides: `SCHEMATHESIS_STAGING_ENDPOINT_TAGS`, `SCHEMATHESIS_STAGING_ENDPOINTS`, `SCHEMATHESIS_STAGING_WORKERS`, `SCHEMATHESIS_STAGING_MAX_EXAMPLES`, `SCHEMATHESIS_STAGING_PHASES`.
  - Uses the same CLI resolution order (`SCHEMATHESIS_CLI` -> local `.venv-schemathesis` -> `PATH`).
  - Output: `documents/tests/4-contract-tests/schemathesis/reports/staging/<timestamp>/{schemathesis-staging.xml,schemathesis-staging.har}`.

Both scripts validate the OpenAPI file exists before invoking Schemathesis and print the full argument list so runs can be reproduced manually if needed.

For full local orchestration (build + migrate + seed + server + Newman + Schemathesis):

- `npm run contract:local:quick`
- `npm run contract:local:gate`
- `npm run contract:local:full`
- `npm run contract:local:exploratory`

### Environment Variable Reference

| Variable                                    | Purpose                                                                       | Example / Default                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `SCHEMATHESIS_CLI`                          | Path to the Schemathesis binary (defaults to `schemathesis` in current venv). | `.venv/bin/schemathesis`                                                      |
| `SCHEMATHESIS_LOCAL_BASE_URL`               | Override local base URL.                                                      | `http://localhost:8002/api/v1`                                                |
| `SCHEMATHESIS_LOCAL_TOKEN`                  | JWT for seeded primary user. **Required** for local runs.                     | `eyJhbGciOiJIUzI1...`                                                         |
| `SCHEMATHESIS_LOCAL_ENDPOINT_TAGS`          | Comma-separated OpenAPI tags to fuzz locally.                                 | `Auth,Analytics,Metrics,Metric Logs,Metric Settings,Metric Categories,Trends` |
| `SCHEMATHESIS_LOCAL_ENDPOINTS`              | Optional comma-separated list of specific operationIds/paths to target.       | `getMetricsId`                                                                |
| `SCHEMATHESIS_LOCAL_PROFILE`                | Local profile preset (`quick`, `gate`, `full`, `exploratory`).                | `quick` (default when unspecified/invalid)                                    |
| `SCHEMATHESIS_LOCAL_MODE`                   | Override Schemathesis generation mode.                                        | `positive` (`quick/gate/full`), `all` (`exploratory`)                         |
| `SCHEMATHESIS_LOCAL_WORKERS`                | Worker pool size override for local runs (overrides profile preset).          | `2` (`quick/gate`), `4` (`full/exploratory`)                                  |
| `SCHEMATHESIS_LOCAL_MAX_EXAMPLES`           | Hypothesis example limit override (overrides profile preset).                 | `10/15/50` from profile preset                                                |
| `SCHEMATHESIS_LOCAL_PHASES`                 | Override ordered phases (overrides profile preset).                           | profile-dependent                                                             |
| `SCHEMATHESIS_LOCAL_CHECKS`                 | Override Schemathesis checks list.                                            | `all`                                                                         |
| `SCHEMATHESIS_LOCAL_SUPPRESS_HEALTH_CHECKS` | Suppress a health check when triaging generators.                             | `quick/gate/full` default to `too_slow,filter_too_much`                       |
| `SCHEMATHESIS_LOCAL_MAX_FAILURES`           | Stop after N failures.                                                        | quick `10`, gate `15`, full `30`                                              |
| `SCHEMATHESIS_LOCAL_REQUEST_TIMEOUT`        | Per-request timeout passed to Schemathesis.                                   | `10000`                                                                       |
| `SCHEMATHESIS_LOCAL_SEED`                   | Force deterministic Hypothesis seed for reproducible runs.                    | `123456789`                                                                   |
| `SCHEMATHESIS_STAGING_BASE_URL`             | HTTPS base URL for staging backend. **Required** for staging runs.            | `https://lakira-backend-stg.onrender.com`                                     |
| `SCHEMATHESIS_STAGING_TOKEN`                | Long-lived staging JWT. **Required**.                                         | `eyJhbGciOiJIUzI1...`                                                         |
| `SCHEMATHESIS_STAGING_ENDPOINT_TAGS`        | Tag override for staging runs.                                                | Same as local                                                                 |
| `SCHEMATHESIS_STAGING_ENDPOINTS`            | Restrict staging run to specific endpoints during debugging.                  | `getAnalyticsDashboard`                                                       |
| `SCHEMATHESIS_STAGING_WORKERS`              | Worker pool size for staging (set explicitly in CI to avoid resource thrash). | `4`                                                                           |
| `SCHEMATHESIS_STAGING_MAX_EXAMPLES`         | Hypothesis example limit for staging runs.                                    | `50`                                                                          |
| `SCHEMATHESIS_STAGING_PHASES`               | Override the phases list for staging runs.                                    | `examples,coverage,fuzzing,stateful`                                          |

## 4. Reports & Artifacts

- HAR (JSON) plus JUnit XML reports capture full interaction history + CI-friendly summaries for each run.
- Store both under `schemathesis/reports/<env>/<timestamp>/` (already handled by the runner scripts). Upload entire folders as artifacts in CI jobs.
- When failures occur, keep the JSON report path handy and paste into `documents/tests/4-contract-tests/incidents.md` so investigators can replay the issue.

## 5. Troubleshooting

- **`schemathesis: command not found`** – ensure your Python virtualenv is activated or set `SCHEMATHESIS_CLI` to the binary path.
- **`OpenAPI spec not found`** – run `npm run docs:openapi:generate`; runners bail out early if the JSON is missing to avoid stale results.
- **401 responses** – regenerate the seed (`npm run seed:contract-tests`) and export the new `SCHEMATHESIS_LOCAL_TOKEN`. For staging, rotate the service account JWT and update GitHub secrets.
- **Analytics endpoints returning 400** – every visualization request must include either a valid `last=` window or both `start` and `end` ISO timestamps, and `tz` must be a non-empty IANA zone. Leaving `tz` blank or supplying only one end of the window will trigger the validation errors Schemathesis currently surfaces.
- **Burst of 429 failures** – the global rate limiter applies even to contract runs. Set `DISABLE_RATE_LIMITING=true` (as in `.env.test`) or whitelist the Schemathesis service account before rerunning.
- **Random 404s / invalid IDs** – confirm `--stateful=links` is enabled (default) and that the OpenAPI spec includes the correct `operationId` relationships. If any endpoints require manual setup, document them in the plan + checklist.
- **Slow runs** – start with `npm run test:contract:schemathesis:local:quick` (or `npm run contract:local:quick`), then escalate to `gate`/`full` only when needed. For additional control, tune `SCHEMATHESIS_*_MAX_EXAMPLES`, `SCHEMATHESIS_LOCAL_MAX_FAILURES`, or split tags (analytics vs metrics) while keeping the ≥90% coverage target outlined in the metrics tracker.

## 6. Next Steps

- Keep `quick` as the default local loop and run `gate` before opening a PR.
- Reserve `full` (`stateful` included, positive mode) for deterministic deep debugging.
- Use `exploratory` (`mode=all`) as a non-blocking noise-tolerant run when you explicitly want negative-case fuzzing depth.
- Continue recording regressions and fixes in [`schemathesis/findings.md`](./findings.md) and `documents/tests/4-contract-tests/incidents.md`.
- Keep staging contract runs wired in CI (`contract_staging`) and upload JUnit/HAR artifacts for traceability.
