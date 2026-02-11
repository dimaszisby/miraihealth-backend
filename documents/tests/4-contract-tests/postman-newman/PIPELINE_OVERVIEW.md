# Contract Test Pipeline Overview – Lakira Backend

## 1. Purpose

This document describes **how** the Postman/Newman contract tests fit into the Lakira Backend **CI/CD pipeline**, which environments they run against, and how they act as a **gate** for API changes that impact the frontend.

It is intended for:

- Backend and DevOps engineers maintaining Jenkins/CI configuration.
- Reviewers assessing the quality of Lakira’s deployment pipeline.
- FE developers who want to understand when API contracts are considered “safe”.

---

## 2. Pipeline Position

A typical Lakira Backend pipeline:

```text
commit / pull request
  ↓
Install, Lint & Type Check
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
Build & Package (Docker image)
  ↓
Deploy to Staging
  ↓
Contract Tests (Postman/Newman)  ← THIS DOCUMENT
  ↓
End-to-End Tests (optional)
  ↓
Manual Approval / Automated Deploy to Production
```

---

## 3. GitHub Actions Implementation (2026-01-14 update)

### 3.1 `contract_local`

- Runs on `ubuntu-latest` after the `tests` job succeeds.
- Provisions Postgres + Redis containers, installs Node deps, then regenerates the OpenAPI spec (`npm run docs:openapi:generate`) so Schemathesis reflects the latest controllers.
- Migrates the database, starts the backend on port `4000`, and waits for `/api/v1/health`.
- Executes `npm run test:contract:local`, which seeds deterministic fixtures and runs every Postman collection with the local environment JSON.
- Installs Schemathesis via `pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt`, extracts the freshly generated JWT from `tmp/contract-seed.json`, and runs `npm run test:contract:schemathesis:local` against the same backend instance.
- Uploads artifacts:
  - `documents/tests/4-contract-tests/postman-newman/reports/local/**` → `newman-contract-local`
  - `documents/tests/4-contract-tests/schemathesis/reports/local/**` → `schemathesis-contract-local`

### 3.2 `deploy_staging`

- Triggers the Render staging deploy hook (`RENDER_STAGING_DEPLOY_HOOK_URL`) and polls `STAGING_HEALTH_URL` until HTTP 200 or timeout.
- Remains gated on `contract_local` so staging is never refreshed when the local contract suite fails.

### 3.3 `contract_staging`

- Checks out the repo, installs Node deps, and runs `npm run test:contract:staging`.
- `scripts/run-contract-staging.js` maps CI secrets (`STAGING_BASE_URL`, `STAGING_CONTRACT_TOKEN`, seeded IDs, etc.) into the Postman environment overrides at runtime.
- Artifacts: `documents/tests/4-contract-tests/postman-newman/reports/staging/**` uploaded as `newman-contract-staging`. Schemathesis-on-staging will be appended once staging tokens + runtime budget are finalized.

---

## 4. Artifacts & Follow-Up Actions

- Inspect `newman-contract-local` for local CLI/XML/HTML outputs before merging a PR; failures block the pipeline automatically.
- Download `schemathesis-contract-local` when fuzzing exposes schema drift—triage results belong in `schemathesis/findings.md`, `incidents.md`, and `metrics-tracker.md`.
- Staging artifacts remain essential for release readiness; keep `STAGING_*` secrets rotating (see CI/CD backend README) and ensure report URLs are linked when filing tickets.
- For staging execution/triage details, consult [`STAGING_RUNBOOK.md`](./STAGING_RUNBOOK.md) which lists deploy-hook steps, manual reproduction commands, and secret rotation expectations.

---

## 5. Next Steps

1. Provision staging secrets (`STAGING_CONTRACT_TOKEN`, seeded IDs) in GitHub Actions so the staging job can start running end-to-end.
2. Add Schemathesis-on-staging (nightly or post-deploy) and upload its artifacts alongside Newman.
3. Update branch protections so `contract_local` success is required for PR merges and document that expectation in the CI/CD guides.
