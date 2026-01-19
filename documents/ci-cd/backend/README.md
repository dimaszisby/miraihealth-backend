# Lakira Backend – CI/CD Overview (GitHub Actions)

## 1. Purpose

This document provides an overview of the **Continuous Integration / Continuous Delivery (CI/CD)** pipeline for the Lakira Backend using **GitHub Actions**.

It describes:

- Which stages run on each push / pull request.
- How tests and contract checks are wired into the pipeline.
- How staging deployments and contract tests fit together.

For high-level project-wide strategy, see `documents/ci-cd/CI_CD_STRATEGY.md`.

---

## 2. Goals

- Ensure every backend change is:

  - Linted and type-checked,
  - Covered by unit and integration tests,
  - Validated via API contract tests (Postman/Newman),
    before being considered stable.

- Provide a **repeatable pipeline definition** suitable for:

  - Recruiters and interviewers reviewing the repository.
  - AI agents (Codex) helping maintain or extend the pipeline.

- Keep the implementation **cost-aware and simple**, using:
  - GitHub Actions as primary CI engine.
  - Managed PaaS for staging deployments (Render).

> Special Note for Codex: When modifying or generating workflow YAMLs for the backend, read this file and `GITHUB_ACTIONS_PIPELINE_PLAN.md` first.

---

## 3. Backend CI/CD Pipeline Shape

### 3.1 Triggers

The main backend workflow is triggered on:

- `push` to:
  - `main`
  - `dev`
  - `feature/**`
- `pull_request` targeting:
  - `main`
  - `dev`

### 3.2 Stages (Jobs)

A typical pipeline is composed of these jobs:

1. **checks** – Lint & Typecheck
2. **tests** – Unit & Integration tests (with Postgres + Redis services)
   - Runs both fast test commands and coverage variants (`test:unit:coverage`, `test:integration:coverage`) and uploads `coverage/jest-unit` + `coverage/jest-integration` as artifacts.
3. **contract_local** – Contract tests against a locally started backend (optional intermediate step)
4. **deploy_staging** (future) – Deploy backend to staging PaaS
5. **contract_staging** (future) – Run contract tests against staging backend

Later, you may add:

- **e2e_backend** – Backend E2E/API flows.
- **performance** – Load tests against staging.

---

## 4. Key Workflows & Files

- **Workflow YAML (example):**

  - `.github/workflows/backend-ci.yml`

- **Supporting scripts (recommended):**

  - `documents/tests/4-contract-tests/postman-newman/scripts/run-contract-local.js`
  - `documents/tests/4-contract-tests/postman-newman/scripts/run-contract-staging.js`

- **Backend configuration for CI:**

  - `package.json` scripts:
    - `lint`
    - `typecheck`
    - `test:unit`
    - `test:integration`
    - `test:contract:local`
    - `test:contract:staging`
    - `build`
    - `start:test`

> Special Note for Codex: When normalizing `package.json` scripts, ensure they align with these names and that the workflow jobs call the same commands.

---

## 5. Environments & Secrets

The backend pipeline uses three logical environments:

1. **Local (developer)**

   - Runs via `npm run` commands directly.
   - Uses local Docker services for Postgres/Redis.

2. **GitHub Actions (CI)**

   - Uses service containers for Postgres/Redis.
   - Uses secrets for DB credentials and JWT keys as needed.

3. **Staging (PaaS)** – planned
   - Backend deployed on Render (managed platform).
   - Configured via platform environment variables.
   - Contract tests point to this environment using `lakira-staging.postman_environment.json`.

Detailed mapping (URLs, env vars, secrets) is maintained in:

- `documents/ci-cd/backend/ENVIRONMENTS_MATRIX.md`

### 5.1 Database Migrations in CI

- `npm run db:migrate:test` is expected to:
  - Drop/recreate the test database (idempotent),
  - Apply the latest migrations,
  - Seed required fixture data (service accounts, test users).
- `npm run start:test` should assume those migrations have already run.
- If migrations require extra flags (e.g. skipping data seeds), document them in `package.json` scripts before updating workflows.

> Special Note for Codex: Do not modify migration commands inside workflows without updating this subsection and the corresponding scripts.

---

## 6. Relationship to Testing & Contract Docs

The backend CI pipeline is tightly coupled with:

- `documents/tests/TESTING_STRATEGY.md`
- `documents/tests/4-contract-tests/postman-newman/PLAN.md`
- `documents/tests/4-contract-tests/postman-newman/CHECKLIST.md`
- `documents/tests/4-contract-tests/postman-newman/PIPELINE_OVERVIEW.md`

CI jobs call the same scripts and commands referenced in those documents, ensuring that:

- The **theoretical testing strategy** is reflected in the **actual pipeline**.
- There is a single source of truth for each layer:
  - Testing strategy → tests/
  - CI/CD strategy → ci-cd/

---

## 7. Merge Requirements & Branch Protection

- The `contract_local` job is part of the default pipeline and must stay **green** before any PR merges to `main`/`dev`.
- Enforce this via GitHub branch protection rules:
  1. Open **Repository Settings → Branches → Branch protection rules**.
  2. Require status checks to pass before merging and add `contract_local` (job name) to the required checks list.
  3. Optionally add `checks` + `tests` so lint/unit/integration suites stay enforced.
- Document exceptions in PR descriptions and re-run the workflow rather than bypassing checks, since contract seeds + Schemathesis rely on deterministic fixtures to catch regressions early.
- When new jobs are added (e.g., `contract_staging`, nightly Schemathesis), update this section and the branch protection configuration accordingly.

> Special Note for Codex: If you modify job names or add/remove required checks, update this section plus `GITHUB_ACTIONS_PIPELINE_PLAN.md` so future contributors know which jobs gate merges.

---

## 8. Future Extensions

Planned/optional enhancements:

- **deploy_staging job**:

  - Build Docker image or use platform buildpacks.
  - Deploy to Render staging environment.

- **contract_staging job**:

  - Run Newman against staging using `lakira-staging.postman_environment.json`.
  - Archive reports as artifacts.

- **Jenkins experimental pipeline**:
  - Short-lived Jenkins setup documented in `JENKINS_NOTES.md`.
  - Mirrors the GitHub Actions pipeline stages for learning.

---

## 9. Summary

- The Lakira Backend CI/CD is implemented primarily with **GitHub Actions**, following the strategy in `CI_CD_STRATEGY.md`.
- Pipelines are designed to:
  - Run on every push/PR,
  - Enforce lint, typecheck, unit, integration, and contract tests,
  - Eventually deploy to and validate against staging.
- The documentation in this `backend/` folder ensures that anyone (including AI agents) can understand and safely modify the pipeline without guesswork.
