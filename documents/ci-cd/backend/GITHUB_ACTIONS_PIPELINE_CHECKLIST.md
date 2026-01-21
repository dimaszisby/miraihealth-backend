# Lakira Backend – GitHub Actions Pipeline Checklist

Use this checklist when:

- Setting up the backend pipeline for the first time.
- Making significant CI/CD changes.
- Reviewing the pipeline as part of a release or refactor.

---

## 1. Workflow Files & Docs

- [ ] Backend workflow exists at `.github/workflows/backend-ci.yml`.
- [ ] Workflow name is clear (e.g. `backend-ci`).
- [ ] Workflow is documented in:
  - [ ] `documents/ci-cd/backend/README.md`
  - [ ] `documents/ci-cd/backend/GITHUB_ACTIONS_PIPELINE_PLAN.md`
  - [ ] `documents/ci-cd/backend/GITHUB_ACTIONS_WORKFLOW_GUIDELINES.md`

> Special Note for Codex: When adding or renaming backend workflows, ensure they are referenced in these docs.

---

## 2. Triggers, Branches & Concurrency

- [ ] Workflow triggers on:
  - [ ] `push` to `main`, `dev`, and `feature/**`.
  - [ ] `pull_request` targeting `main` and `dev`.
- [ ] Branch protections require `backend-ci` to pass before merging into `main`.
- [ ] Workflow uses `concurrency` to cancel in-progress runs on the same branch:

  - [ ] `concurrency.group` includes the branch/ref.
  - [ ] `concurrency.cancel-in-progress` is set to `true`.

> Special Note for Codex: Do not remove or relax these triggers/concurrency blocks unless the root documents are updated in the same change.

---

## 3. Job Structure & Timeouts

- [ ] `checks` job exists and runs:

  - [ ] `npm ci`
  - [ ] `npm run lint`
  - [ ] `npm run typecheck`
  - [ ] Job has `timeout-minutes` configured.

- [ ] `tests` job exists and:

  - [ ] Declares Postgres and Redis service containers.
  - [ ] Runs `npm ci`.
  - [ ] Runs `npm run db:migrate:test` (or equivalent).
  - [ ] Runs `npm run test:unit`.
  - [ ] Runs `npm run test:integration`.
  - [ ] Runs `npm run test:unit:coverage` and stores the output (e.g., renames `coverage/jest` to `coverage/jest-unit`).
  - [ ] Runs `npm run test:integration:coverage` and stores the output (e.g., renames `coverage/jest` to `coverage/jest-integration`).
  - [ ] Uploads the combined coverage folders as a GitHub Actions artifact.
  - [ ] Depends on `checks` (`needs: checks`).
  - [ ] Has `timeout-minutes` configured.

- [ ] `contract_local` job exists and:

  - [ ] Declares Postgres and Redis service containers.
  - [ ] Runs `npm ci`.
  - [ ] Runs DB migrations for contract DB (can reuse `db:migrate:test`).
  - [ ] Starts backend with `npm run start:test` in background.
  - [ ] Waits for health endpoint (e.g. via `wait-on`).
  - [ ] Runs `npm run test:contract:local`.
  - [ ] Uploads Newman local reports as artifacts.
  - [ ] Depends on `tests` (`needs: tests`).
  - [ ] Has `timeout-minutes` configured.

- [ ] (Future) `deploy_staging` job:

  - [ ] Depends on `contract_local` or `tests`.
  - [ ] Triggers Render staging deploy via deploy hook.
  - [ ] Polls staging health endpoint until healthy or timeout.
  - [ ] Fails pipeline if staging does not become healthy.

- [ ] (Future) `contract_staging` job:
  - [ ] Depends on `deploy_staging`.
  - [ ] Runs `npm run test:contract:staging`.
  - [ ] Uploads Newman staging reports as artifacts.
  - [ ] Has `timeout-minutes` configured.

> Special Note for Codex: When editing `.github/workflows/backend-ci.yml`, treat these checklist bullets as requirements—skip automation if any listed command/script is missing or renamed.

---

## 4. Services & Environment Variables

- [ ] Postgres service configured with:

  - [ ] `POSTGRES_USER=postgres`
  - [ ] `POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD_TEST }}`
  - [ ] `POSTGRES_DB=lakira_ci`
  - [ ] Health checks (`pg_isready`).

- [ ] Redis service configured with health checks.

- [ ] Jobs that talk to DB/Redis set:

  - [ ] `DATABASE_URL` points to the Postgres service exposed on `localhost:5432` (GitHub Actions forwards service ports to the runner host).
  - [ ] `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are exported when tools (e.g., `sequelize-cli`) require discrete values. When `DATABASE_URL` is present, the env manager will derive these automatically at runtime.
  - [ ] `REDIS_URL` uses the Redis service exposed on `localhost:6379`.
  - [ ] `NODE_ENV=test` for tests/contract jobs.
  - [ ] `JWT_SECRET_TEST` from secrets.

- [ ] Staging deploy job reads:

  - [ ] `RENDER_STAGING_DEPLOY_HOOK_URL` from secrets.
  - [ ] `STAGING_HEALTH_URL` from secrets.

- [ ] Staging contract job reads:
  - [ ] `STAGING_BASE_URL` from secrets or env.

> Special Note for Codex: Never invent new env var names or service hostnames in workflows; use the ones specified here and in `ENVIRONMENTS_MATRIX.md`.

---

## 5. `package.json` Scripts

Backend `package.json` includes:

- [ ] `"lint": "…"` – ESLint.
- [ ] `"typecheck": "tsc --noEmit"` (or equivalent).
- [ ] `"test:unit": "…"`.
- [ ] `"test:integration": "…"`.
- [ ] `"test:contract:local": "node documents/tests/4-contract-tests/postman-newman/scripts/run-contract-local.js"` (or equivalent).
- [ ] `"test:contract:staging": "node documents/tests/4-contract-tests/postman-newman/scripts/run-contract-staging.js"` (future).
- [ ] `"db:migrate:test": "…"`.
- [ ] `"start:test": "…"`.
- [ ] `"build": "tsc -p tsconfig.build.json"` (or equivalent).

> Special Note for Codex: Confirm these scripts exist before wiring them into workflows; if any are missing, update `package.json` and this doc together.

---

## 6. Caching & Performance

- [ ] `actions/setup-node@v4` is used with:
  - [ ] `node-version: 20`.
  - [ ] `cache: npm` enabled.
- [ ] Jobs use `npm ci` instead of `npm install`.
- [ ] No unnecessary duplicate `npm ci` steps in the same job.

> Special Note for Codex: Always prefer cached installs in generated workflows—only fall back if the cache strategy conflicts with these bullets.

---

## 7. Contract Test Integration

- [ ] `documents/tests/4-contract-tests/postman-newman/PLAN.md` and `PIPELINE_OVERVIEW.md` describe CI usage (local + staging).
- [ ] Newman installed via:
  - [ ] DevDependency (preferred), or
  - [ ] CI install step.
- [ ] `test:contract:local` uses:
  - [ ] `lakira-local.postman_environment.json`.
  - [ ] All relevant collections.
- [ ] `test:contract:staging` uses:
  - [ ] `lakira-staging.postman_environment.json`.
- [ ] Contract runs produce:

  - [ ] JUnit XML reports.
  - [ ] HTML reports.
  - [ ] Saved under `documents/tests/4-contract-tests/postman-newman/reports/local/**` and `reports/staging/**`.

- [ ] GitHub Actions uploads:
  - [ ] Local contract reports as artifacts.
  - [ ] Staging contract reports as artifacts.

> Special Note for Codex: Do not drop artifact upload steps when editing workflows; they are required for interview-ready evidence.

---

## 8. Security & Compliance Gates (Backend CI)

- [ ] GitHub **Dependabot** is enabled for npm.
- [ ] GitHub **secret scanning** is enabled.
- [ ] (Optional / Recommended) A **CodeQL** workflow exists for SAST.
- [ ] (Optional) A “security” job runs `npm audit --audit-level=high` and fails on high/critical issues.
- [ ] No secrets are hard-coded in workflow YAML or committed `.env` files.
- [ ] Staging environment uses **synthetic/test data** only.

> Special Note for Codex: If you add security scans (CodeQL, npm audit, etc.), document them here so future agents know the expected gates.

---

## 9. Coverage & Success Criteria (Optional, but Good for Portfolio)

- [ ] Unit/integration tests generate coverage reports.
- [ ] Coverage thresholds are defined (e.g. `--coverageThreshold` in Jest) and enforced in CI, **or** documented as a future improvement.
- [ ] A known green run on `dev` or `main` is referenced in:
  - [ ] `documents/tests/4-contract-tests/postman-newman/CHECKLIST.md` (as a baseline).

> Special Note for Codex: When referencing coverage or green runs in PRs, link back to this checklist to keep the narrative consistent.

---

## 10. Final Gate

Before calling the backend pipeline “stable” and “portfolio-ready”:

- [ ] A full run of `backend-ci` on `dev` or `main` is green:
  - [ ] `checks` passes.
  - [ ] `tests` passes.
  - [ ] `contract_local` passes.
  - [ ] (Future) `deploy_staging` + `contract_staging` pass.
- [ ] This checklist, the pipeline plan, and CI/CD strategy documents are updated to reflect the final state.

> Special Note for Codex: Do not mark the pipeline “ready” in commits/PRs unless every applicable box above is satisfied or updated.
