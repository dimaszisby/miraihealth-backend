# Lakira Backend to Frontend CI/CD Handoff

As of **February 16, 2026**, this document captures the backend details needed to implement frontend CI/CD safely.

---

## 1. Environment Matrix (Dev/Staging/Prod) + FE-Consumed Env Vars

FE convention: keep these equal per environment:

- `API_URL`
- `NEXT_PUBLIC_API_BASE_URL`

| Target env            | `API_URL`                                            | `NEXT_PUBLIC_API_BASE_URL`                           | Backend health URL                                          | Status                                   |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `dev`                 | `http://localhost:4000/api/v1`                       | `http://localhost:4000/api/v1`                       | `http://localhost:4000/api/v1/health`                       | Active                                   |
| `staging` / `preview` | `https://lakira-backend-staging.onrender.com/api/v1` | `https://lakira-backend-staging.onrender.com/api/v1` | `https://lakira-backend-staging.onrender.com/api/v1/health` | Active                                   |
| `prod`                | `TBD`                                                | `TBD`                                                | `TBD`                                                       | Production backend URL not available yet |

Secret naming already used in docs:

- FE CI secret: `STAGING_API_BASE_URL` (feed both FE vars in CI)
- BE CI secret: `STAGING_BASE_URL` (backend contract tests/deploy jobs; same value as above)

---

## 2. API Contract Source of Truth + Versioning/Compatibility Policy

### Source of truth

- Committed OpenAPI spec: `docs/openapi/lakira-backend-openapi.json`
- Runtime endpoint: `GET /api/v1/docs/openapi.json`
- Generation command: `npm run docs:openapi:generate`

### Current compatibility policy

- The live API namespace is versioned under `/api/v1/*`.
- Any FE-visible contract change must update:
  - backend implementation,
  - OpenAPI spec,
  - contract tests (Newman/Schemathesis),
  - FE integration points.
- For potentially breaking changes, backend and frontend must explicitly decide whether to:
  - keep backward compatibility in `v1`, or
  - introduce `v2` endpoints and run a controlled migration.

---

## 3. Auth, CORS, CSRF, Cookie/Domain/SameSite

### Auth strategy

- Auth is JWT Bearer token based (header: `Authorization: Bearer <token>`).
- `POST /api/v1/auth/login` and `POST /api/v1/auth/register` return a token in response payload.
- JWT lifetime is 7 days (provider default).
- `POST /api/v1/auth/logout` is stateless; FE should clear local token storage client-side.

### CORS behavior

- CORS origin is controlled by backend env var `CORS_ORIGIN`.
- Backend has `credentials: true`.
- Allowed methods currently configured: `GET`, `POST`, `PUT`, `DELETE`.

Guidance for FE deployment surfaces (documentation-only, no backend code change in this task):

| FE surface    | CORS expectation                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Local FE      | `CORS_ORIGIN=http://localhost:3000`                                                                                                |
| Preview FE    | Allow the preview origin strategy used by FE (single shared preview domain recommended until backend supports multi-origin config) |
| Production FE | `TBD` until FE production domain is finalized                                                                                      |

### CSRF and cookies

- No CSRF token contract is currently enforced by backend.
- No cookie-based auth contract is currently required by backend.
- `Domain` / `SameSite` cookie settings are currently not part of the FE auth flow.

### Important release risk to resolve before full FE CD

- Backend exposes `PATCH` routes (`/metric-settings/:id/achieve`, `/metric-settings/:id/display`) but CORS allow-methods currently omit `PATCH`.
- `CORS_ORIGIN` currently supports a single origin string, which may not cover branch-based Vercel preview domains.

---

## 4. FE/BE Release Dependency Rule

Use this release rule:

| Change type                                          | Can FE and BE deploy independently? | Recommended order                                                       |
| ---------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| FE-only UI/internal changes (no API contract change) | Yes                                 | FE deploy anytime                                                       |
| BE-only internal changes (no API contract change)    | Yes                                 | BE deploy anytime                                                       |
| Backward-compatible API additions/changes            | Partially (coordinate)              | BE first (staging `contract_staging` green), then FE                    |
| Breaking API changes                                 | No                                  | Introduce compatibility/versioning plan first, then coordinated rollout |

Minimum gate before FE production promotion:

1. Backend staging health green.
2. Backend contract checks green (`contract_local`, plus `contract_staging` on `staging` branch).
3. FE CI checks green against staging API base URL.

---

## 5. Smoke-Check Targets + Non-Prod Test Account Flow

### Smoke endpoints

- `GET /api/v1/health` -> expect `200` and `status: ok`
- `POST /api/v1/auth/login` -> expect `200` and token in payload
- `GET /api/v1/auth/profile` with bearer token -> expect `200`
- `GET /api/v1/metrics?limit=1` with bearer token -> expect `200`

### Non-prod account flow

- Local deterministic user (seed script): `contract-primary@lakira.dev` / `ContractPrimary!123`
- Staging: use a dedicated synthetic test account (documented example: `staging-tester@lakira.app`) and/or `STAGING_CONTRACT_TOKEN` in CI
- Do not commit staging credentials; store them only in GitHub/Vercel secrets

### Example post-deploy smoke sequence

```bash
curl -fsS "$STAGING_HEALTH_URL"

TOKEN=$(curl -fsS -X POST "$STAGING_BASE_URL/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"<staging-test-email>","password":"<staging-test-password>"}' \
  | jq -r '.data.token')

curl -fsS "$STAGING_BASE_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN"

curl -fsS "$STAGING_BASE_URL/metrics?limit=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. References

- `docs/ci-cd/backend/ENVIRONMENTS_MATRIX.md`
- `docs/ci-cd/backend/GITHUB_ACTIONS_PIPELINE_PLAN.md`
- `docs/ci-cd/frontend/ENVIRONMENTS_MATRIX.md`
- `docs/tests/4-contract-tests/README.md`
- `docs/tests/4-contract-tests/seed-strategy.md`
- `docs/tests/4-contract-tests/postman-newman/WORKFLOW_GUIDELINES.md`
- `src/server.ts`
- `src/features/auth/infrastructure/http/authMiddleware.ts`
- `src/features/auth/infrastructure/providers/JwtTokenProvider.ts`

---

## 7. Unresolved (TBD - Deferred)

These items are intentionally unresolved for now and will be completed later when production setup is ready.

| Item                                           | Current value | Follow-up question                                                                          |
| ---------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| Production backend API base URL                | `TBD`         | What is the exact production backend API base URL (must include `/api/v1`)?                 |
| Production frontend domain (for CORS guidance) | `TBD`         | What is the final FE production domain that backend should allow as `CORS_ORIGIN` guidance? |
