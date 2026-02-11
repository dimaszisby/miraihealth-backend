# Lakira Backend – GitHub Actions Pipeline Plan

## 1. Purpose

This plan describes the **intended structure** of the Lakira Backend GitHub Actions pipeline:

- Jobs, stages, and their dependencies.
- Commands executed in each job.
- How tests and contract checks are integrated.
- How staging deploys on Render are verified.

It complements:

- `documents/ci-cd/backend/README.md`
- `documents/tests/TESTING_STRATEGY.md`
- `documents/tests/4-contract-tests/postman-newman/PIPELINE_OVERVIEW.md`

> Special Note for Codex: When generating or modifying `.github/workflows/backend-ci.yml`, align it with this plan.

---

## 2. Workflow Triggers

The `backend-ci` workflow should be triggered on:

- `push` to:
  - `main`
  - `dev`
  - `feature/**`
- `pull_request` targeting:
  - `main`
  - `dev`

---

## 3. Jobs & Stages

> Special Note for Codex: Keep job names, `needs` relationships, and script invocations exactly as documented here unless this plan is updated in the same change.

### 3.1 Job: `checks` – Lint & Typecheck

**Goal:** Fail fast on obvious issues (style, types) before running heavier tests.

- **Runs on:** `ubuntu-latest`
- **Steps:**
  1. Checkout code.
  2. Setup Node (v20) with npm cache.
  3. `npm ci`
  4. `npm run lint`
  5. `npm run typecheck`

**Dependencies:**

- None (first job in the pipeline).

---

### 3.2 Job: `tests` – Unit & Integration Tests

**Goal:** Validate backend behaviour at unit and integration levels.

- **Runs on:** `ubuntu-latest`
- **Needs:** `checks`
- **Services:**
  - `postgres` (e.g. `postgres:15`)
  - `redis` (`redis:7`)
- **Environment:**
  - `DATABASE_URL` → points to test DB in service container.
  - `REDIS_URL` → points to Redis service.
  - `NODE_ENV=test`
  - `JWT_SECRET` → from `JWT_SECRET_TEST` secret.
- **Steps:**
  1. Checkout code.
  2. Setup Node (v20) with npm cache.
  3. `npm ci`
  4. Run DB migrations for test DB (e.g. `npm run db:migrate:test`).
  5. `npm run test:unit`
  6. `npm run test:integration`
  7. `npm run test:unit:coverage` → rename/move `coverage/jest` to `coverage/jest-unit`.
  8. `npm run test:integration:coverage` → rename/move `coverage/jest` to `coverage/jest-integration`.
  9. Upload the `coverage/` directory (containing both coverage folders) as an artifact.

---

### 3.3 Job: `contract_local` – Contract Tests (Local Backend)

**Goal:** Run Postman/Newman contract tests against a backend instance started within the CI job.

- **Runs on:** `ubuntu-latest`
- **Needs:** `tests`
- **Services:**
  - `postgres` (for contract DB; can reuse same DB as tests if safe)
  - `redis`
- **Environment:**
  - `DATABASE_URL` → contract/test DB.
  - `REDIS_URL` → Redis service.
  - `NODE_ENV=test`
  - `JWT_SECRET` → from `JWT_SECRET_TEST`.
- **Steps:**
  1. Checkout code.
  2. Setup Node (v20) with npm cache.
  3. `npm ci`.
  4. Regenerate the OpenAPI spec (`npm run docs:openapi:generate`) so Schemathesis uses the latest controllers.
  5. Run DB migrations for contract DB (can reuse `db:migrate:test`).
  6. Start backend in background (e.g. `npm run start:test`).
  7. Wait for server to boot (e.g. `npx wait-on http://localhost:4000/api/v1/health`).
  8. `npm run test:contract:local`
     - This script should:
       - Run Newman with `lakira-local.postman_environment.json`.
       - Execute all relevant contract collections.
       - Produce JUnit + HTML reports under `documents/tests/4-contract-tests/postman-newman/reports/local/**`.
  9. Install Schemathesis (`pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt`), export the deterministic JWT from `tmp/contract-seed.json`, and run `npm run test:contract:schemathesis:local` against the same backend instance.
  10. Upload artifacts from both suites:
      - `newman-contract-local` → `documents/tests/4-contract-tests/postman-newman/reports/local/**`
      - `schemathesis-contract-local` → `documents/tests/4-contract-tests/schemathesis/reports/local/**`

---

### 3.4 Job: `deploy_staging` – Deploy Backend to Render Staging

**Goal:** Deploy the backend to the **Render staging service** and ensure it is healthy before running staging contract tests.

- **Runs on:** `ubuntu-latest`
- **Needs:** `contract_local` (or at minimum `tests`)
- **Secrets required:**
  - `RENDER_STAGING_DEPLOY_HOOK_URL` – Render deploy hook URL for the staging service.
  - `STAGING_HEALTH_URL` – e.g. `https://lakira-backend-staging.onrender.com/api/v1/health`.

**Steps (example):**

1. **Trigger a new staging deploy via Render deploy hook**

   The job calls the Render deploy hook for the staging service:

   ```bash
   curl -X POST "$RENDER_STAGING_DEPLOY_HOOK_URL"
   ```

2. **Wait for the deployment to complete and verify health**

   After triggering the deploy, the job polls the staging health endpoint until it responds with `200 OK` or times out:

   ```bash
   for i in {1..30}; do
     STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_HEALTH_URL" || echo "000")
     if [ "$STATUS" -eq 200 ]; then
       echo "Staging is healthy."
       exit 0
     fi

     echo "Waiting for staging to become healthy (status: $STATUS)..."
     sleep 10
   done

   echo "Staging did not become healthy in time."
   exit 1
   ```

   - The loop runs up to 30 times with a 10-second sleep (≈5 minutes max).
   - If the health check does not return `200` within the loop, the job fails and **blocks** `contract_staging`.

> Special Note for Codex: When implementing this job, include both the deploy-hook call and the health-check loop—skipping either step violates this plan.

3. **Surface Render errors (manual step)**

   If the job fails because the health check never reaches `200`:

   - Inspect the Render dashboard logs for the staging service,
   - Confirm whether the deploy failed (build error, crash loop, migration failure, etc.).

**Migrations & Rollback Strategy:**

- **Migrations:** choose and document one of these approaches:

  1. **On-startup migrations**

     - Render’s start command runs a migration script before starting the app, for example:  
       `npm run db:migrate:production && node dist/server.js`.
     - Pros: simple; each new deploy migrates automatically.
     - Cons: if migration fails, the app never starts (health check stays red).

  2. **Separate migration job**
     - Use a dedicated Render job or admin script that runs migrations before promoting a new version.
     - Pros: more control; you can validate migrations separately.
     - Cons: more moving parts.

- **Rollback:** if a deploy is bad:

  - Option A: Manually re-deploy the last known good commit in Render.
  - Option B: Revert the offending commit in Git and let the normal pipeline re-deploy.
  - In both cases, `STAGING_HEALTH_URL` should return `200` again and unblock future `contract_staging` runs.

> Special Note for Codex: When you later integrate the exact Render configuration (build command, start command, migration strategy), update this section with the concrete commands and any additional health probes used by the platform.

---

### 3.5 Job: `contract_staging` – Contract Tests (Staging Backend)

**Goal:** Validate that the **deployed staging backend** on Render conforms to the API contract.

- **Runs on:** `ubuntu-latest`
- **Needs:** `deploy_staging`
- **Secrets required:**
  - `STAGING_BASE_URL` – base URL for the staging API, e.g. `https://lakira-backend-staging.onrender.com/api/v1`.
  - Contract-test fixture secrets consumed by Newman: `STAGING_CONTRACT_TOKEN`, `STAGING_CONTRACT_USER_ID`, `STAGING_CONTRACT_SECONDARY_USER_ID`, `STAGING_CATEGORY_REVENUE_ID`, `STAGING_CATEGORY_PRODUCTIVITY_ID`, `STAGING_METRIC_REVENUE_ID`, `STAGING_METRIC_PRODUCTIVITY_ID`, `STAGING_METRIC_SETTINGS_REVENUE_ID`, `STAGING_METRIC_SETTINGS_PRODUCTIVITY_ID`, `STAGING_METRIC_LOG_REVENUE_LATEST_ID`, `STAGING_METRIC_LOG_PRODUCTIVITY_LATEST_ID`.
  - Schemathesis staging run variables: `SCHEMATHESIS_STAGING_BASE_URL` (usually the same as `STAGING_BASE_URL`) and `SCHEMATHESIS_STAGING_TOKEN`.

**Environment:**

- `STAGING_BASE_URL` is used as the `baseUrl` in the staging Postman environment.
- Any sensitive auth tokens should be injected via GitHub secrets, not committed JSON.
- Fixture secrets map 1:1 with the deterministic IDs defined in `documents/tests/4-contract-tests/seed-strategy.md`. When staging is reseeded, refresh each secret so Newman and Schemathesis continue to hit the correct records.

**Steps:**

1. **Checkout repository**

   - Use `actions/checkout@v4` to obtain collections, environment files, and scripts.

2. **Setup Node & dependencies**

   - Use `actions/setup-node@v4` (Node 20, npm cache).
   - Run `npm ci`.

3. **Run staging contract tests**

   - Execute:

     ```bash
     npm run test:contract:staging
     ```

   - The `test:contract:staging` script should:
     - Use `lakira-staging.postman_environment.json`.
     - Set `baseUrl` to `${STAGING_BASE_URL}` (via env substitution or Newman `--env-var` flags).
     - Run all relevant collections (analytics, metrics, metric-logs, metric-settings, auth).
     - Generate:
       - JUnit XML report,
       - HTML summary report,
         under `documents/tests/4-contract-tests/postman-newman/reports/staging/**`.

4. **Upload reports as artifacts**

   ```yaml
   - name: Upload Newman reports (staging)
     uses: actions/upload-artifact@v4
     with:
       name: newman-staging
       path: documents/tests/4-contract-tests/postman-newman/reports/staging
       retention-days: 14
   ```

**Notes:**

- This job acts as the **final verification gate** for the staging environment.
- If `contract_staging` fails:
  - Inspect the HTML/JUnit reports first,
  - Check the staging health endpoint and Render logs,
  - Update the backend implementation, OpenAPI spec, or Postman collections to eliminate contract drift.
- For a portfolio project, you may choose to run `contract_staging` only on:
  - `main` branch, and/or
  - Tagged releases (e.g. `v*.*.*`) to control cost.
- Rotate staging secrets whenever IDs/tokens change (log the rotation date in `metrics-tracker.md`). Prefer regenerating data via the deterministic seed routine so the Postman/Schemathesis collections stay in sync with both staging and local fixtures.

> Special Note for Codex: Never remove the artifact upload or Newman reporting steps when editing this job—recruiters rely on those outputs.

> Special Note for Codex: Keep `deploy_staging` and `contract_staging` in sync with the actual Newman scripts and environment files under `documents/tests/4-contract-tests/postman-newman/**`.

---

## 4. Required `package.json` Scripts

The following scripts should exist and be consistent:

- `lint`
- `typecheck`
- `test:unit`
- `test:integration`
- `test:contract:local`
- `test:contract:staging`
- `db:migrate:test` (or similar)
- `build`
- `start:test` – start backend on a known port for tests/contract tests.

> Special Note for Codex: When normalizing `package.json`, ensure these script names are present and correctly wired to existing tools.

---

## 5. Artifacts & Reporting

- Unit/Integration tests:

  - Optionally generate Jest JUnit reports and upload.

- Contract tests:
  - Always generate JUnit and HTML reports:
    - `documents/tests/4-contract-tests/postman-newman/reports/local/**` (for `contract_local`).
    - `documents/tests/4-contract-tests/postman-newman/reports/staging/**` (for `contract_staging`).

Workflows should:

- Use `actions/upload-artifact` to store these under build artifacts.
- Optionally integrate JUnit results into GitHub test summaries.

---

## 6. Updating the Pipeline

When modifying the backend pipeline:

1. Update this plan if job structure or ordering changes.
2. Update `.github/workflows/backend-ci.yml` accordingly.
3. If new stages depend on tests or contract tests, reflect them in:
   - `documents/tests/TESTING_STRATEGY.md`
   - `documents/tests/4-contract-tests/postman-newman/PIPELINE_OVERVIEW.md`
4. Open a PR with:
   - Short description of changes.
   - Note that pipeline ran successfully on the PR.

---

## 7. Summary

This plan defines the **intended GitHub Actions pipeline** for Lakira Backend:

- Lint + typecheck → unit + integration → contract (local) → deploy to staging → contract (staging).
- It ensures a consistent story across:
  - Code,
  - Tests,
  - Contract suites,
  - Deployment environments.

Aligning `.github/workflows/backend-ci.yml` with this plan makes the CI/CD story clear, repeatable, and easy to explain in a production or interview setting.
