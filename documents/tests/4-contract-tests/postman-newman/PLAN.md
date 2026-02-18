# Postman / Newman Contract Test Plan – Lakira Backend Core APIs

## 1. Purpose & Goals

This plan defines how API contract testing is performed for the Lakira Backend using Postman collections and Newman.

Contract tests verify that the **runtime behaviour** of backend APIs (methods, status codes, payload shapes, and critical headers such as caching/ETag) remains consistent with the **documented API contract** (OpenAPI + feature docs). They serve as the guardrail between:

- The **Lakira backend** (Express + Sequelize + PostgreSQL).
- The **Lakira frontend** (Next.js) and any other external consumers.

The goals are to:

- Validate that **client-facing endpoints** for analytics, metrics, metric logs, metric settings, and auth strictly conform to their contracts.
- Catch breaking changes early (e.g. status code changes, field additions/removals, header behaviour changes).
- Provide a **reproducible Postman/Newman harness** FE can trust when building or refactoring features.
- Integrate contract tests into **CI/CD** so regressions block merges into protected branches.

This plan initially focuses on the analytics and metrics domain, but the structure applies to all core FE-facing APIs.

---

## 2. Scope

### 2.1 In-Scope

**Service:** Lakira Backend (Node/Express + Sequelize + PostgreSQL).

**Postman collections (per feature):**

- `collections/lakira-analytics-contract.postman_collection.json`
- `collections/lakira-metrics-contract.postman_collection.json`
- `collections/lakira-metric-logs-contract.postman_collection.json`
- `collections/lakira-metric-settings-contract.postman_collection.json`
- `collections/lakira-auth-contract.postman_collection.json`

**Endpoints covered (from `lakira-backend-openapi.json`):**

- **Analytics**
  - `GET /analytics/dashboard`
  - `GET /analytics/metrics/{metricId}`

- **Metrics**
  - `GET /metrics`
  - `POST /metrics`
  - `GET /metrics/{id}`
  - `PUT /metrics/{id}`
  - `DELETE /metrics/{id}`
  - `GET /metrics/{metricId}/trends`

- **Metric Logs**
  - `GET /metric-logs`
  - `POST /metric-logs`
  - `GET /metric-logs/{id}`
  - `DELETE /metric-logs/{id}`
  - `GET /metric-logs/stats`

- **Metric Settings**
  - `GET /metric-settings`
  - `POST /metric-settings`
  - `GET /metric-settings/{id}`
  - `PUT /metric-settings/{id}`
  - `DELETE /metric-settings/{id}`
  - `PATCH /metric-settings/{id}/achieve`
  - `PATCH /metric-settings/{id}/display`

- **Auth**
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/profile`
  - `PUT /auth/profile`

**Behaviours to verify for each endpoint:**

- HTTP **methods, paths, and parameters** (path, query, body).
- **Status codes** for success and error cases as defined in OpenAPI.
- **Response payload structure and field types**.
- Critical **headers**:
  - `Content-Type` for all JSON responses.
  - `ETag` and `Cache-Control` for analytics dashboard & visualization endpoints.
- **Error contracts**:
  - Usage of standard error responses (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `InternalServerError`).
  - Error JSON shape (`status`, `message`, and optional `errors` array).

### 2.2 Out-of-Scope

- Performance / load testing (covered by performance / web-vitals test plans).
- Deep business logic correctness beyond what can be observed at the HTTP boundary (covered by unit and integration tests).
- Frontend implementation details or UI flows (covered by FE integration/E2E tests).

---

## 3. References

- **OpenAPI Spec (source of truth)**  
  `documents/openapi/lakira-backend-openapi.json`

- **Backend Architecture Docs**
  - `documents/documentation/architecture/lakira-backend-db-schema.md` – tables and relationships.
  - `documents/documentation/architecture/lakira-backend-routes.md` – route overview.
  - `documents/documentation/architecture/lakira-backend-types.md` – DTOs and shared types.

- **Feature-level Docs**
  - Analytics:
    - `documents/development/features/analytics/analytics-backend-overhaul-plan.md`
    - `documents/development/features/analytics/analytics-backend-overhaul-checklist.md`
    - `documents/development/features/analytics/dashboard-etag-validation.md`
    - `documents/development/features/analytics/dashboard-v2-sample-response.json`
  - Metrics:
    - `documents/development/features/metric/README.md`
  - Metric Logs:
    - `documents/development/features/metric-log/README.md`
  - Metric Settings:
    - `documents/development/features/metric-settings/README.md`
  - Auth:
    - `documents/development/features/auth/README.md`

- **Frontend/Product Docs**
  - `documents/documentation/product/lakira-frontend-prd.md`
  - `ui-documentation.json` – UI analytics & dashboard visual requirements.

- **Testing Docs**
  - `documents/tests/TESTING_STRATEGY.md`
  - `documents/tests/README.md`
- **Staging Runbook**
  - `documents/tests/4-contract-tests/postman-newman/STAGING_RUNBOOK.md`

---

## 4. Test Strategy & Approach

### 4.1 Technique

- **Specification-based contract testing**
  - Use the OpenAPI spec as the primary contract.
  - Maintain Postman collections whose requests and assertions mirror the spec.

- **Environment-driven**
  - Run the same collections against:
    - **Local** backend (`lakira-local.postman_environment.json`).
    - **Staging** backend (`lakira-staging.postman_environment.json`).

- **Automation-first**
  - All collections must be runnable via Newman:
    - Locally via npm scripts (e.g. `npm run test:contract:local`).
    - In CI (e.g. `npm run test:contract:staging` during pipeline).
  - `contract_local` job is required on PR branches (branch protection enforced per `documents/ci-cd/backend/README.md` §7). Staging runs follow the checklist in `postman-newman/STAGING_RUNBOOK.md`.

### 4.2 Contract Assertions

Each Postman request should assert:

1. **Status codes**
   - Success codes: `200`, `201`, `204` as defined in OpenAPI for each endpoint.
   - Error codes: `400`, `401`, `403`, `404`, `500` (and any other feature-specific codes).

2. **Response body shape**
   - Required fields exist and have the correct type.
   - No unintentional breaking changes to key field names.
   - For analytics dashboard (`GET /analytics/dashboard`) the **v2 payload** must at least include:
     - `items[]`:
       - `metricId`
       - `name`
       - `unit`
       - `category_name`
       - `category_icon`
       - `category_color`
       - `priority`
       - `series[]` with `bucketStartISO` and `value`
       - `stats` object with `average`, `min`, `max`, `count`
       - `lastLogAt`, `firstLogAt`, `totalLogs`, `latestValue`, `latestBucketStart`
       - `requestedRange`, `actualRange`, `fallbackRangeUsed`, `fallbackStrategy`
     - `meta`:
       - `bucket`, `tz`
       - `range.startISO`, `range.endISO`
       - `count`, `totalMetrics`, `fallbackMetrics`
     - `sync`:
       - `etagSeed`

3. **Headers**
   - All JSON responses: `Content-Type: application/json` (or `application/json; charset=utf-8`).
   - Analytics dashboard & metric visualization:
     - `ETag` set on `200` responses.
     - `Cache-Control` aligned with dashboard caching policy (private + `max-age` + `stale-while-revalidate`).

4. **Error contracts**
   - `BadRequestError` (`400`):
     ```json
     {
       "status": "fail",
       "message": "Bad Request",
       "errors": [
         {
           "path": ["..."],
           "message": "..."
         }
       ]
     }
     ```
   - `UnauthorizedError` (`401`):
     ```json
     {
       "status": "fail",
       "message": "Unauthorized"
     }
     ```
   - Similar shapes for `ForbiddenError`, `NotFoundError`, and `InternalServerError` as defined in OpenAPI.

---

## 5. Test Coverage & Scenarios

### 5.1 Analytics

**Endpoints:**

- `GET /analytics/dashboard`
- `GET /analytics/metrics/{metricId}`

**Scenarios:**

1. **Happy path – Dashboard**
   - Authenticated user with metrics and logs.
   - Asserts:
     - `200 OK`
     - Correct `Content-Type`
     - `ETag` present
     - Full v2 payload fields as described in §4.2.

2. **Happy path – Single metric visualization**
   - `GET /analytics/metrics/{metricId}` with valid UUID and params.
   - Asserts:
     - `200 OK`
     - Valid visualization response structure (`series`, `stats`, etc.) as per `VisualizationResponse` schema.

3. **Conditional requests (ETag / If-None-Match)**
   - First request: capture `ETag` from `200` response.
   - Second request: send `If-None-Match` with same value.
   - Asserts:
     - `304 Not Modified`
     - Empty response body (`res.status(304).end()` semantics).
     - `ETag` header preserved.
     - `Cache-Control` header preserved.

4. **Invalid parameters**
   - Invalid bucket (`bucket=yearly`).
   - Invalid time range (`start > end`, invalid `last` format, etc.).
   - Asserts:
     - `400 Bad Request`
     - `errors[]` contains validation failures.

5. **Auth & security**
   - Missing token, invalid token.
   - Asserts:
     - `401 Unauthorized`
     - Standard error body.

6. **Not found**
   - For `GET /analytics/metrics/{metricId}` with a non-existent metric.
   - Asserts:
     - `404 Not Found`
     - Standard error body.

---

### 5.2 Metrics

**Endpoints:**

- `GET /metrics`
- `POST /metrics`
- `GET /metrics/{id}`
- `PUT /metrics/{id}`
- `DELETE /metrics/{id}`
- `GET /metrics/{metricId}/trends`

**Key scenarios:**

1. **Create metric**
   - `POST /metrics` with valid payload.
   - Asserts:
     - `201 Created`
     - Response contains newly created metric with expected fields.

2. **List metrics**
   - `GET /metrics` for authenticated user.
   - Asserts:
     - `200 OK`
     - List contains known seeded metric(s).
     - Pagination/filters behave as expected (if applicable).

3. **Get metric detail**
   - `GET /metrics/{id}` for existing metric.
   - Asserts:
     - `200 OK`
     - Fields match `MetricDetail` schema.

4. **Update metric**
   - `PUT /metrics/{id}` with valid changes.
   - Asserts:
     - `200 OK`
     - Updated fields reflected in response.

5. **Delete metric**
   - `DELETE /metrics/{id}`.
   - Asserts:
     - `204 No Content`
     - Subsequent `GET /metrics/{id}` returns `404`.

6. **Trends + caching**
   - `GET /metrics/{metricId}/trends` with valid params.
   - Validates trending payload structure for charting (buckets, values, meta).
   - If the endpoint supports conditional requests, repeat the analytics flow (capture `ETag`, assert `304` on `If-None-Match`).

7. **Validation & auth errors**
   - Missing required fields on create/update → `400`.
   - Missing/invalid token → `401`.
   - Non-existent metric id → `404`.

---

### 5.3 Metric Logs

**Endpoints:**

- `GET /metric-logs`
- `POST /metric-logs`
- `GET /metric-logs/{id}`
- `DELETE /metric-logs/{id}`
- `GET /metric-logs/stats`

**Key scenarios:**

1. **Create metric log**
   - `POST /metric-logs` with valid payload.
   - Asserts:
     - `201 Created`
     - Response includes ID, metric reference, value, log date.

2. **List metric logs**
   - `GET /metric-logs` with filters (metricId, date range).
   - Asserts:
     - `200 OK`
     - Logs returned match filter constraints.

3. **Get metric log detail**
   - `GET /metric-logs/{id}` for an existing log.
   - Asserts:
     - `200 OK`
     - Fields match log schema.

4. **Delete metric log**
   - `DELETE /metric-logs/{id}`.
   - Asserts:
     - `204 No Content`
     - Subsequent `GET` for same ID → `404`.

5. **Stats endpoint**
   - `GET /metric-logs/stats` with valid parameters.
   - Asserts:
     - `200 OK`
     - Aggregated stats shape compatible with analytics expectations.

6. **Validation & auth**
   - Invalid payload → `400`.
   - Missing/invalid token → `401`.
   - Non-existent ID → `404`.
   - Rate limit handling: ensure `.env.test` sets `DISABLE_RATE_LIMITING=true` so tests do not fail with `429` during bulk log scenarios (documented in README + checklist).

---

### 5.4 Metric Settings

**Endpoints:**

- `GET /metric-settings`
- `POST /metric-settings`
- `GET /metric-settings/{id}`
- `PUT /metric-settings/{id}`
- `DELETE /metric-settings/{id}`
- `PATCH /metric-settings/{id}/achieve`
- `PATCH /metric-settings/{id}/display`

**Key scenarios:**

1. **Create settings**
   - `POST /metric-settings` with valid payload.
   - Asserts:
     - `201 Created`
     - Mapping to metric ID and user is correct.

2. **List settings**
   - `GET /metric-settings`.
   - Asserts:
     - `200 OK`
     - Returns settings for current user only.

3. **Update settings**
   - `PUT /metric-settings/{id}`.
   - Asserts:
     - `200 OK`
     - Updated values reflected in response.

4. **Toggle achievement**
   - `PATCH /metric-settings/{id}/achieve`.
   - Asserts:
     - `200 OK`
     - `achievedAt` or equivalent flag updated correctly.

5. **Toggle display**
   - `PATCH /metric-settings/{id}/display`.
   - Asserts:
     - `200 OK`
     - `showOnDashboard` / display settings updated correctly.

6. **Delete settings**
   - `DELETE /metric-settings/{id}` → `204`.
   - Follow-up `GET` → `404`.

7. **Validation & auth**
   - Invalid payload → `400`.
   - Missing/invalid token → `401`.
   - ID not belonging to the user → `404` / `403` (depending on implementation).

---

### 5.5 Auth

**Endpoints:**

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/profile`
- `PUT /auth/profile`

**Key scenarios:**

1. **Register**
   - Valid registration payload.
   - Asserts:
     - `201 Created`
     - Response contains primary user fields (id, email, username).

2. **Login**
   - Correct credentials.
   - Asserts:
     - `200 OK`
     - Response includes token (JWT) and user profile.

3. **Profile read**
   - `GET /auth/profile` with valid token.
   - Asserts:
     - `200 OK`
     - Follows profile schema.

4. **Profile update**
   - `PUT /auth/profile` with valid payload.
   - Asserts:
     - `200 OK`
     - Changes reflected in response.

5. **Logout**
   - `POST /auth/logout`.
   - Asserts:
     - `200 OK`
     - Optional: token invalidated depending on implementation.

6. **Error cases**
   - Register with duplicate email → `400 Bad Request` with validation errors.
   - Login with wrong password → `401 Unauthorized`.
   - Access profile without valid token → `401`.

---

## 6. Environments & Test Data

### 6.1 Environments

- **Local**
  - Environment file: `environments/lakira-local.postman_environment.json`
  - `{{baseUrl}}` → local backend (e.g. `http://localhost:3000` or Docker port).
  - Auth variables: tokens for seeded test users.

- **Staging**
  - Environment file: `environments/lakira-staging.postman_environment.json`
  - `{{baseUrl}}` → staging backend URL.
  - Auth variables: tokens/credentials for staging test accounts.

### 6.2 Test Data

- Seed scripts must create:
  - At least one **test user** with:
    - A small but realistic set of metrics and logs.
    - Metric settings and categories sufficient to exercise analytics.
  - One or more **empty-state users** to exercise “no data yet” behaviours.

- Seeds should be:
  - **Idempotent** (safe to run multiple times).
  - Documented in development docs and referenced here.

---

## 7. Tooling & Artifacts

### 7.1 Tools

- **Postman Desktop / Web** for authoring and debugging collections.
- **Newman** for automated runs:
  - Local dev script (example):

    ```bash
    npm run test:contract:local
    # internally:
    # newman run documents/tests/4-contract-tests/postman-newman/collections/lakira-analytics-contract.postman_collection.json \
    #   -e documents/tests/4-contract-tests/postman-newman/environments/lakira-local.postman_environment.json \
    #   --reporters cli,junit,html ...
    ```

  - Staging script (example):

    ```bash
    npm run test:contract:staging
    ```

### 7.2 Reports & Storage

- Newman reporters: `cli`, `junit`, `html`.
- Store artifacts under:
  - `artifacts/tests/contract-tests/postman-newman/<env>/<YYYY-MM-DD>/<commit>/`

- For each run keep at least:
  - JUnit XML (`newman-contract-<env>.xml`) for CI integration.
  - HTML summary report (`newman-contract-<env>.html`) for human review.

---

## 8. Execution Workflow

### 8.1 Local (developer)

1. Start backend (Docker or `npm run dev`).
2. Run database migrations and seeds for test data.
3. Ensure local Postman environment variables are up to date.
4. Run:

   ```bash
   npm run test:contract:local
   ```

   This script will:
   - Run database migrations + `npm run seed:contract-tests` if needed.
   - Execute `run-contract-local.js` to run every collection (auth, analytics, metrics, metric logs, metric settings) with the local environment file.
   - Store HTML/JUnit reports under `documents/tests/4-contract-tests/postman-newman/reports/local/<timestamp>/`.

### 8.2 CI / Staging

1. Ensure branch protection requires the `contract_local` job on `main`/`develop` (see `documents/ci-cd/backend/README.md` §7) so PRs cannot merge without a green contract gate.
2. Confirm staging secrets + Render deploy hook listed in `STAGING_RUNBOOK.md` are populated in GitHub Actions and match the deterministic seed output (`tmp/contract-seed.json`).
3. Workflow sequence:
   - `deploy_staging` triggers the Render deploy hook and polls `STAGING_HEALTH_URL` until HTTP 200 (5-minute timeout). Investigate Render logs immediately if health fails.
   - `contract_staging` runs `npm run test:contract:staging`, overriding the Postman environment with seeded IDs/tokens from secrets. Reports land under `postman-newman/reports/staging/<timestamp>/` and must be uploaded as the `newman-contract-staging` artifact.
   - (Upcoming) Schemathesis-on-staging will run after Newman once runtime budgets and tokens are available; artifacts will be uploaded as `schemathesis-contract-staging`.
4. After each staging run:
   - Record runtime + artifact links in `documents/tests/4-contract-tests/metrics-tracker.md`.
   - Log any regressions or infra gaps in `documents/tests/4-contract-tests/incidents.md` (reference the runbook and CI job URL).
   - Rotate secrets as needed and capture the rotation date per the runbook’s checklist.
