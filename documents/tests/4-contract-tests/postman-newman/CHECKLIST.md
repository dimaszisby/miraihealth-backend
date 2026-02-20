# Postman / Newman Contract Test Checklist – Lakira Backend Core APIs

Use this checklist whenever you implement or execute the Postman/Newman contract tests for Lakira Backend.

---

## 1. Pre-Requisites

- [ ] **OpenAPI spec** is up to date and committed:
  - [ ] `documents/openapi/lakira-backend-openapi.json` regenerated.
  - [ ] Generation command documented in `scripts/generate-openapi.ts` and `package.json`.

- [ ] **Backend feature changes** for the current work (analytics / metrics / logs / settings / auth) are merged into the working branch.

- [ ] **Database migrations** applied and **test data seeds** run for the target environment (local or staging).
- [ ] **Staging readiness** confirmed when targeting Render:
  - [ ] Secrets listed in `postman-newman/STAGING_RUNBOOK.md` exist in GitHub Actions and match the latest seeded IDs/tokens.
  - [ ] `documents/tests/4-contract-tests/postman-newman/STAGING_RUNBOOK.md` reviewed so deploy-hook + rotation steps are clear.
  - [ ] `documents/ci-cd/backend/README.md` §7 followed to ensure `contract_local` is a required status check before kicking off staging runs.

---

## 2. Postman Collections & Environments

- [ ] Collections exist and are versioned in Git:
  - [ ] `collections/lakira-analytics-contract.postman_collection.json`
  - [ ] `collections/lakira-metrics-contract.postman_collection.json`
  - [ ] `collections/lakira-metric-logs-contract.postman_collection.json`
  - [ ] `collections/lakira-metric-settings-contract.postman_collection.json`
  - [ ] `collections/lakira-auth-contract.postman_collection.json`

- [ ] Environments exist and are configured:
  - [ ] `environments/lakira-local.postman_environment.json`
    - [ ] `{{baseUrl}}` points to local backend.
    - [ ] Valid auth token or credentials for test user(s).
    - [ ] IDs for seeded metrics, settings, etc. stored as variables where needed.

  - [ ] `environments/lakira-staging.postman_environment.json`
    - [ ] `{{baseUrl}}` points to staging backend.
    - [ ] Valid staging credentials/tokens for test accounts.
    - [ ] Any environment-specific IDs documented.

---

## 3. Endpoint & Scenario Coverage

### 3.1 Endpoint Inventory

For each endpoint below, ensure there is at least one Postman request in the corresponding collection.

- [ ] **Analytics**
  - [ ] `GET /analytics/dashboard`
  - [ ] `GET /analytics/metrics/{metricId}`

- [ ] **Metrics**
  - [ ] `GET /metrics`
  - [ ] `POST /metrics`
  - [ ] `GET /metrics/{id}`
  - [ ] `PUT /metrics/{id}`
  - [ ] `DELETE /metrics/{id}`
  - [ ] `GET /metrics/{metricId}/trends`

- [ ] **Metric Logs**
  - [ ] `GET /metric-logs`
  - [ ] `POST /metric-logs`
  - [ ] `GET /metric-logs/{id}`
  - [ ] `DELETE /metric-logs/{id}`
  - [ ] `GET /metric-logs/stats`

- [ ] **Metric Settings**
  - [ ] `GET /metric-settings`
  - [ ] `POST /metric-settings`
  - [ ] `GET /metric-settings/{id}`
  - [ ] `PUT /metric-settings/{id}`
  - [ ] `DELETE /metric-settings/{id}`
  - [ ] `PATCH /metric-settings/{id}/achieve`
  - [ ] `PATCH /metric-settings/{id}/display`

- [ ] **Auth**
  - [ ] `POST /auth/register`
  - [ ] `POST /auth/login`
  - [ ] `POST /auth/logout`
  - [ ] `GET /auth/profile`
  - [ ] `PUT /auth/profile`

---

### 3.2 Analytics Scenarios

**Dashboard (`GET /analytics/dashboard`)**

- [ ] Happy path:
  - [ ] Returns `200`.
  - [ ] `Content-Type` is JSON.
  - [ ] `ETag` header present.
  - [ ] Response body includes:
    - [ ] `items[]` list with required fields (`metricId`, `name`, `unit`, category fields, `series`, `stats`, etc.).
    - [ ] `meta` object (`bucket`, `tz`, `range.startISO`, `range.endISO`, `count`, `totalMetrics`, `fallbackMetrics`).
    - [ ] `sync.etagSeed`.

- [ ] ETag / If-None-Match:
  - [ ] Second request with `If-None-Match` equal to previous `ETag`:
    - [ ] Returns `304`.
    - [ ] Response body is empty.
    - [ ] `ETag` and `Cache-Control` headers are present.

- [ ] Invalid parameters:
  - [ ] Invalid `bucket` → `400` with validation errors.
  - [ ] Invalid `last` or inconsistent `start` / `end` → `400`.

- [ ] Auth:
  - [ ] Missing/invalid token → `401` with standard error body.

**Metric visualization (`GET /analytics/metrics/{metricId}`)**

- [ ] Happy path:
  - [ ] `200` with visualization payload conforming to `VisualizationResponse` schema.
- [ ] Not found:
  - [ ] Non-existent `metricId` → `404` with standard error body.
- [ ] Auth:
  - [ ] Missing/invalid token → `401`.

---

### 3.3 Metrics Scenarios

For the metrics collection:

- [ ] Create metric (`POST /metrics`):
  - [ ] `201` with created metric payload.
  - [ ] Validation errors (`400`) covered (e.g. missing name or unit).

- [ ] List metrics (`GET /metrics`):
  - [ ] `200` with JSON array.
  - [ ] Response includes known seeded metric(s) for test user.

- [ ] Get metric detail (`GET /metrics/{id}`):
  - [ ] `200` for existing ID.
  - [ ] `404` for non-existent or unauthorized ID.

- [ ] Update metric (`PUT /metrics/{id}`):
  - [ ] `200` for valid update.
  - [ ] `400` for invalid payload.
  - [ ] `401`/`404` for auth or not-found scenarios.

- [ ] Delete metric (`DELETE /metrics/{id}`):
  - [ ] `204` for existing metric.
  - [ ] Follow-up `GET` returns `404`.

- [ ] Trends (`GET /metrics/{metricId}/trends`):
  - [ ] `200` with payload suitable for charting.
  - [ ] Validation errors and auth errors covered.

---

### 3.4 Metric Logs Scenarios

- [ ] Create log (`POST /metric-logs`):
  - [ ] `201` with correct schema.
  - [ ] Validations for missing/invalid fields produce `400`.

- [ ] List logs (`GET /metric-logs`):
  - [ ] `200` with filters for metricId/date range.
  - [ ] Empty results case covered.

- [ ] Log detail (`GET /metric-logs/{id}`):
  - [ ] `200` for existing ID.
  - [ ] `404` for non-existent ID.

- [ ] Delete log (`DELETE /metric-logs/{id}`):
  - [ ] `204` on success.
  - [ ] Follow-up `GET` returns `404`.

- [ ] Stats (`GET /metric-logs/stats`):
  - [ ] `200` with aggregated stats as per spec.
  - [ ] Auth errors (`401`) covered.

---

### 3.5 Metric Settings Scenarios

- [ ] Create settings (`POST /metric-settings`):
  - [ ] `201` with created settings.
  - [ ] Validation errors produce `400`.

- [ ] List settings (`GET /metric-settings`):
  - [ ] `200` listing only the current user’s settings.

- [ ] Detail (`GET /metric-settings/{id}`):
  - [ ] `200` for existing ID.
  - [ ] `404` for ID not found or not owned by user.

- [ ] Update settings (`PUT /metric-settings/{id}`):
  - [ ] `200` with updated payload.
  - [ ] `400` for invalid input.

- [ ] Achieve toggle (`PATCH /metric-settings/{id}/achieve`):
  - [ ] `200` status and achievement fields updated as expected.

- [ ] Display toggle (`PATCH /metric-settings/{id}/display`):
  - [ ] `200` and display fields updated.

- [ ] Delete (`DELETE /metric-settings/{id}`):
  - [ ] `204`.
  - [ ] Follow-up `GET` returns `404`.

- [ ] Auth:
  - [ ] Missing/invalid token → `401`.

---

### 3.6 Auth Scenarios

- [ ] Register (`POST /auth/register`):
  - [ ] `201` for valid payload.
  - [ ] Duplicate email → `400` with validation errors.

- [ ] Login (`POST /auth/login`):
  - [ ] `200` and returns token + profile.
  - [ ] Wrong credentials → `401`.

- [ ] Profile read (`GET /auth/profile`):
  - [ ] `200` with current user profile.
  - [ ] Missing/invalid token → `401`.

- [ ] Profile update (`PUT /auth/profile`):
  - [ ] `200` with updated profile.
  - [ ] Validation errors → `400`.

- [ ] Logout (`POST /auth/logout`):
  - [ ] `200` for valid token.
  - [ ] Behaviour consistent with auth strategy (e.g., stateless logout).

---

## 4. Postman Test Assertions (Per Request)

For each request in each collection:

- [ ] Assert **status code**.
- [ ] Assert **`Content-Type`** is JSON.
- [ ] Assert **required fields** and data types in the response body.
- [ ] For analytics endpoints:
  - [ ] Assert `ETag` and `Cache-Control` headers where applicable.
  - [ ] Assert response matches v2 dashboard schema (key fields).

- [ ] For error scenarios:
  - [ ] Assert error body matches OpenAPI responses (`status`, `message`, optional `errors` array).
  - [ ] Assert correct HTTP code (`400`, `401`, `403`, `404`, `500`).

(Optional but recommended:)

- [ ] JSON Schema validation in Postman using schemas aligned with OpenAPI.

---

## 5. Local Execution Checklist

- [ ] Backend is running locally.
- [ ] Local database migrated and seeded with test data.
- [ ] `lakira-local.postman_environment.json` is up to date (baseUrl, tokens, IDs).
- [ ] Run:

  ```bash
  npm run test:contract:local
  ```

---

## 6. Staging / CI Execution Checklist

- [ ] `deploy_staging` job succeeds (Render deploy hook + `STAGING_HEALTH_URL` confirmed healthy).
- [ ] Secrets listed in `postman-newman/STAGING_RUNBOOK.md` populated in GitHub Actions and match the latest deterministic seed output (IDs + tokens).
- [ ] `contract_staging` job runs `npm run test:contract:staging` and uploads reports to `documents/tests/4-contract-tests/postman-newman/reports/staging/<timestamp>/`.
- [ ] CI artifacts uploaded (`newman-contract-staging`, and `schemathesis-contract-staging` once enabled).
- [ ] Runbook followed for manual reproduction / triage when failures occur; rotation dates logged in `metrics-tracker.md`.

---

## 7. Documentation & Metrics

- [ ] Update `postman-newman/PLAN.md`, `CHECKLIST.md`, or `README.md` if new endpoints/scenarios/processes were added.
- [ ] Add metrics (runtime, pass/fail counts, artifact links) to `documents/tests/4-contract-tests/metrics-tracker.md`.
- [ ] Log incidents in `documents/tests/4-contract-tests/incidents.md` when staging/local runs uncover regressions or infrastructure gaps.
