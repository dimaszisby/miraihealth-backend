# Lakira Backend – Environments Matrix

## 1. Purpose

This matrix documents **all environments** that touch the Lakira backend and how they are configured:

- Base URLs and Render service identifiers,
- Database and Redis details,
- Secrets / environment variables,
- Postman environment mappings and seed data.

Treat this as the **single source of truth** when wiring CI, Render, and Postman/Newman.

> Special Note for Codex: When asked to “run tests in CI” or “deploy to staging”, read this file first to understand which URLs and secrets to use.

---

## 2. Backend Environments Overview

### 2.1 Summary Table

| Env        | Purpose                                      | Backend Host / Base URL                     | DB Name        | Redis            | Postman Env File                             |
|-----------|----------------------------------------------|---------------------------------------------|---------------|------------------|----------------------------------------------|
| `local`   | Dev machine / Docker Compose                 | `http://localhost:4000`                     | `lakira_local` | `redis://localhost:6379` | `lakira-local.postman_environment.json`   |
| `ci`      | GitHub Actions test & contract pipelines     | `http://localhost:4000` (service container) | `lakira_ci`    | `redis://redis:6379`    | `lakira-local.postman_environment.json`   |
| `staging` | Public “portfolio” environment on Render     | `https://api-staging.lakira.yourdomain.com` | `lakira_stage` | Managed Redis (optional) | `lakira-staging.postman_environment.json` |
| `prod`*   | Optional future production environment       | `https://api.lakira.yourdomain.com`         | `lakira_prod`  | Managed Redis (optional) | (TBD)                                     |

\* For a portfolio project, `staging` may effectively act as “production”. Keep `prod` documented as a future option.

> Replace `api-staging.lakira.yourdomain.com` / `api.lakira.yourdomain.com` with your actual Render custom/domain URLs once configured.

---

## 3. Local Environment

**Use case:** Day-to-day development and manual Postman runs.

- **Backend:**
  - URL: `http://localhost:4000`
  - Port: `4000`
- **Database (Postgres):**
  - Host: `localhost`
  - Port: `5432`
  - DB name: `lakira_local`
  - User: `postgres` (default)
  - Password: `postgres` (or via `.env.local`)
- **Redis:**
  - URL: `redis://localhost:6379`
- **Environment variables (example):**
  - `DATABASE_URL=postgres://postgres:postgres@localhost:5432/lakira_local`
  - `REDIS_URL=redis://localhost:6379`
  - `JWT_SECRET_LOCAL=changeme-local`
  - `NODE_ENV=development`
- **Postman:**
  - Environment: `environments/lakira-local.postman_environment.json`
  - Important variables:
    - `baseUrl` → `http://localhost:4000/api/v1`
    - `authToken` → token for seeded test user

Seeding / fixture notes:

- Local DB can be seeded with `npm run db:seed:local` (or similar).
- Use a dedicated test user (e.g. `test@lakira.local`) shared between Postman and automated tests.

---

## 4. CI Environment (GitHub Actions)

**Use case:** `backend-ci` workflow (`checks` → `tests` → `contract_local`).

- **Backend runtime:**
  - Runs inside the `contract_local` job using `npm run start:test` on `http://localhost:4000`.
- **Postgres service (CI):**
  - Image: `postgres:15`
  - Host (inside job): `postgres`
  - Port: `5432`
  - DB name: `lakira_ci`
  - User: `postgres`
  - Password: `${{ secrets.POSTGRES_PASSWORD_TEST }}`
- **Redis service (CI):**
  - Image: `redis:7`
  - Host: `redis`
  - Port: `6379`
- **Key env vars in CI jobs:**
  - `DATABASE_URL=postgres://postgres:${{ secrets.POSTGRES_PASSWORD_TEST }}@postgres:5432/lakira_ci`
  - `REDIS_URL=redis://redis:6379`
  - `NODE_ENV=test`
  - `JWT_SECRET_TEST=${{ secrets.JWT_SECRET_TEST }}`

Secrets to define in GitHub:

- `POSTGRES_PASSWORD_TEST`
- `JWT_SECRET_TEST`

Postman / Newman in CI:

- `test:contract:local` uses `lakira-local.postman_environment.json`, but overrides:
  - `baseUrl` → `http://localhost:4000/api/v1`

> Special Note for Codex: When generating workflow YAML, use the service hostnames (`postgres`, `redis`) and `DATABASE_URL` above as the canonical CI configuration.

---

## 5. Staging Environment (Render)

**Use case:** Public, stable environment for recruiters, FE integration, and staging contract tests.

- **Platform:** Render PaaS
- **Service (example):**
  - Service name: `lakira-backend-staging`
  - Region: `singapore` (example; pick closest to Jakarta)
- **Backend URL:**
  - Render default: `https://lakira-backend-staging.onrender.com`
  - Optional custom: `https://api-staging.lakira.yourdomain.com`
- **Health endpoint:**
  - `GET /api/v1/health` → 200 + `{ "status": "ok" }`

- **Database:**
  - Hosted Postgres on Render or managed provider
  - DB name: `lakira_stage`
  - Connection string stored as:
    - `DATABASE_URL` Render env var.

- **Redis (optional):**
  - If used, connection string stored as:
    - `REDIS_URL` Render env var.

- **Important environment vars on Render (staging):**
  - `NODE_ENV=production`
  - `DATABASE_URL=postgres://.../lakira_stage`
  - `REDIS_URL=redis://...` (if used)
  - `JWT_SECRET_STAGING=...`
  - `PORT=10000` (Render default) → app should bind to `0.0.0.0:${PORT}`

GitHub secrets for staging deploy:

- `RENDER_STAGING_DEPLOY_HOOK_URL` – Render deploy hook URL.
- `STAGING_BASE_URL` – e.g. `https://lakira-backend-staging.onrender.com/api/v1`
- `STAGING_HEALTH_URL` – e.g. `https://lakira-backend-staging.onrender.com/api/v1/health`
- (Optional) `STAGING_POSTMAN_API_KEY` – if you later use Postman API.
- (Optional) `RENDER_API_KEY` / `RENDER_SERVICE_ID` – if you move from deploy hooks to Render API/CLI deployments.

Postman:

- Environment file: `environments/lakira-staging.postman_environment.json`
  - `baseUrl` → `{{STAGING_BASE_URL}}` value.
  - `authToken` → token for a **staging test user** (seeded via migrations or manual script).

Seed / fixture policy:

- Use synthetic data only.
- Seed a dedicated test account (e.g. `staging-tester@lakira.app`) for contract tests.
- Run seeds as part of staging DB migrations or a separate one-off script.

---

## 6. Production Environment (Optional / Future)

If you later separate prod from staging:

- **Backend URL:** `https://api.lakira.yourdomain.com`
- **Database:** `lakira_prod` with stricter access controls.
- **Secrets:** `JWT_SECRET_PROD`, `DATABASE_URL_PROD`, `REDIS_URL_PROD`, `RENDER_PROD_DEPLOY_HOOK_URL`, `PROD_HEALTH_URL`, etc.
- **Contract tests:** You may run **read-only** contract tests against prod, but **avoid destructive requests** (no DELETE / PUT that modify data) unless using a dedicated prod test tenant.

Document those here once created.
