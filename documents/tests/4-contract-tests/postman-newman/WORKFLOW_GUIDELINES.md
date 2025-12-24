# Contract Test Workflow Guidelines – Lakira Backend

## 1. Purpose

These guidelines define **when** and **how** to update and extend the Postman/Newman contract test suite for the Lakira Backend, ensuring that every change to core APIs is accompanied by corresponding contract updates and verification runs.

This workflow is intended for:

- Backend developers changing or adding endpoints.
- Frontend developers requesting contract guarantees.
- AI agents (Codex) assisting with maintenance and refactoring.

---

## 2. When to Update Contract Tests

Update the contract tests whenever any of the following occur in the **core API surface**:

- A new **client-facing endpoint** is added under:
  - `/analytics/**`, `/metrics/**`, `/metric-logs/**`, `/metric-settings/**`, `/auth/**`.
- An existing endpoint:
  - Changes status code behaviour (e.g. `200 → 201` or `204`).
  - Adds, removes, or renames response fields.
  - Changes error schema or error codes.
  - Modifies cache/ETag behaviour or other critical headers.
- The OpenAPI spec (`documents/openapi/lakira-backend-openapi.json`) is updated.
- Existing FE flows start failing due to suspected API contract drift.

> Special Note for Codex: When a PR modifies files under `src/features/(analytics|metrics|metric-logs|metric-settings|auth)` or `documents/openapi/lakira-backend-openapi.json`, prompt the developer to follow this workflow and assist by updating the relevant collections/tests.

---

## 3. Per-PR Developer Workflow

Use this flow whenever making backend changes that affect APIs.

1. **Design / Discuss the Change**

   - Clarify expected behaviour with FE for breaking changes.
   - Decide whether versioning is needed (e.g. new dashboard version).

2. **Update OpenAPI Spec**

   - Edit `documents/openapi/lakira-backend-openapi.json`:
     - Paths and methods.
     - Parameters and request body schemas.
     - Response schemas and status codes.
     - Error response shapes.

3. **Update Backend Implementation**

   - Implement or update controllers, services, and DTO mappers.
   - Ensure responses match OpenAPI (status + body) exactly.

4. **Update Postman Collection(s)**

   Identify the corresponding collection(s):

   - Analytics → `collections/lakira-analytics-contract.postman_collection.json`
   - Metrics → `collections/lakira-metrics-contract.postman_collection.json`
   - Metric Logs → `collections/lakira-metric-logs-contract.postman_collection.json`
   - Metric Settings → `collections/lakira-metric-settings-contract.postman_collection.json`
   - Auth → `collections/lakira-auth-contract.postman_collection.json`

   For each affected endpoint:

   - Add/update requests and tests covering:
     - **Happy path**.
     - **Validation errors**.
     - **Auth/permission errors**.
     - **Not found/edge cases**.
   - Ensure tests assert:
     - Status code.
     - `Content-Type`.
     - Key body fields and types.
     - `ETag`/cache headers for analytics where applicable.
     - Error schema for negative paths.

5. **Run Contract Tests Locally**

   ```bash
   npm run test:contract:local

   ```

6. **Commit All Related Artifacts**

   - Backend code changes.
   - OpenAPI spec changes.
   - Updated Postman collections/environments.
   - Any new scripts or doc updates (PLAN/CHECKLIST if needed).

7. **Push & Review**

   - Open PR with:
     - Short description of API changes.
     - Mention that contract tests were updated and are green locally.
   - Let CI run contract tests; ensure the stage is green.

8. **Handover to FE (if applicable)**
   - Share:
     - Link to passing contract test report (staging).
     - OpenAPI spec version / commit hash.
     - Any notable changes in payloads or error shapes.

---

## 4. Adding a New Endpoint to Contract Tests

When you introduce a new endpoint:

1. **Add to OpenAPI**

   - Define the path, method, parameters, request body, responses, and error schema.

2. **Create Collection Entry**

   - Locate appropriate collection (e.g. `lakira-analytics-contract.postman_collection.json`).
   - Add a new folder or reuse an existing folder for that feature.
   - Add one or more requests:
     - Happy path.
     - Error cases (validation, 404, auth, etc.).

3. **Define Tests in Postman**

   - In the Postman “Tests” tab, add assertions to:
     - Check expected status code.
     - Validate key fields and types.
     - Confirm important headers (e.g. `Content-Type`, `ETag`).
     - Validate error body structure for negative cases.

4. **Update Environment Variables**

   - Add any new variables needed (e.g. `metricId`, `dashboardId`, etc.) to:
     - `lakira-local.postman_environment.json`
     - `lakira-staging.postman_environment.json`

5. **Run and Verify**
   - Run tests locally, fix any issues.
   - Ensure CI contract tests pass before merging.

> Special Note for Codex: When generating new Postman requests, adhere to naming conventions from `README.md` and assert both success and error cases.

---

## 5. Environment & Data Management

### 5.1 Stable Test Data

- Use **dedicated test users** and data sets for contract tests.
- Ensure seeding is:
  - Repeatable.
  - Idempotent (running seeds multiple times is safe).
- Avoid relying on random or time-sensitive data unless explicitly controlled (e.g. fixed ranges and IDs).

### 5.2 Environment Files

- Maintain environment files under:

  - `environments/lakira-local.postman_environment.json`
  - `environments/lakira-staging.postman_environment.json`

- Use them for:
  - `{{baseUrl}}`
  - Auth tokens or credentials for test accounts.
  - IDs for fixtures (e.g. `{{metricId}}`, `{{userId}}`).

> Special Note for Codex: When updating IDs/variables used in tests, propagate changes to both local and staging environment configs.

### 5.3 Security

- Never store production credentials in these configs.
- Prefer injecting sensitive values via CI environment variables or secrets.
- Test accounts should have minimal permissions necessary for the contract scenarios.

---

## 6. Versioning & Backward Compatibility

When making potentially breaking changes:

- Decide if the endpoint needs **versioning** (e.g. `/api/v1/...` vs `/api/v2/...`).
- Coordinate with FE to:
  - Decide upgrade timeline.
  - Possibly support both old and new versions temporarily.
- Update:
  - OpenAPI spec with deprecation notes.
  - Contract tests for both versions if you run in parallel.

> Special Note for Codex: For versioned analytics endpoints, maintain separate folders in the collection (e.g. `Analytics v1`, `Analytics v2`) and ensure both are covered as needed.

---

## 7. Collaboration with Frontend

- FE should consult these contract tests to:
  - Understand available endpoints and response shapes.
  - Reuse example payloads for mocks.
- When FE observes unexpected behaviour:
  - Check if contract tests cover that scenario.
  - If not, add a test that reproduces the observed mismatch.
- Any FE-visible change in payloads or error formats should:
  - Be implemented first in BE + OpenAPI.
  - Be validated through updated contract tests.
  - Then be consumed by FE.

---

## 8. Using Codex / AI Agents

Guidelines for using Codex/LLM in this workflow:

- Good tasks for Codex:

  - Generating or updating Postman test scripts based on OpenAPI and BE code.
  - Proposing new contract scenarios when new features are added.
  - Translating failing console output from Newman into actionable fixes.

- Always review:
  - Generated tests for correctness and security.
  - File paths and naming are consistent with this folder’s conventions.

> Special Note for Codex: When asked to “extend contract tests for feature X,” follow the flow in sections 3 and 4, and make sure to update plan/checklist references if new scenarios are added.

---

## 9. Anti-Patterns to Avoid

- Skipping contract test updates when:
  - Changing response fields or status codes.
  - Adjusting error handling logic.
- Running contract tests only locally but not in CI.
- Hard-coding production URLs or credentials in collections/environments.
- Using non-deterministic data in assertions (e.g. relying on “current time” without controlling input).

---

## 10. Summary

- Treat contract tests as **first-class citizens** alongside unit and integration tests.
- Any API contract change should be:
  - Reflected in OpenAPI.
  - Enforced by updated Postman tests.
  - Verified locally and in CI.
- Use this workflow to keep the Lakira Backend **stable, predictable, and portfolio-ready** for future employers and collaborators.
