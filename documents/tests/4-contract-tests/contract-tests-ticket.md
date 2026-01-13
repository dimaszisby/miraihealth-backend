# Ticket: Stand Up Contract Tests (Postman + Schemathesis)

## Summary

Deliver a production-ready contract-testing layer for Lakira Backend that covers all frontend-facing APIs via Postman/Newman suites plus Schemathesis-based fuzzing, and integrate those checks into the CI/CD pipeline so regressions block merges and staging deploys.

## Background

- Integration tests reached Phase 3 maturity (doc kit + Redis coverage) and now serve as the foundation for system-level stability.
- CI/CD roadmap (`documents/ci-cd/backend/GITHUB_ACTIONS_PIPELINE_PLAN.md`) explicitly sequences contract tests after integration tests.
- Existing contract-test docs (Postman README/PLAN/CHECKLIST) define desired coverage, but no executable suites, scripts, or CI jobs exist yet.
- Schemathesis folder is empty, so there is no automated spec-fuzzing to catch schema drift.

## Acceptance Criteria

- Postman collections + environment files contain concrete requests/tests for every endpoint listed in the checklist (analytics, metrics, logs, settings, auth).
- Deterministic seed script (`npm run seed:contract-tests`) resets contract data and exports IDs/tokens for environment consumption.
- Local + staging Newman scripts (`npm run test:contract:local`, `npm run test:contract:staging`) execute all collections, assert headers/schema, and upload reports.
- Schemathesis CLI scripts run against local + staging base URLs using the checked-in OpenAPI file, with documented workflow + checklist.
- GitHub Actions pipeline includes `contract_local`, `deploy_staging`, and `contract_staging` jobs as described in the CI plan, and PRs cannot merge without `contract_local` success.
- Metrics tracker captures runtime, pass/fail counts, and endpoint coverage for both Newman and Schemathesis runs.
- README/plan/checklist/ticket/decisions/incidents remain up to date and cross-link supporting docs (Postman + Schemathesis folders, CI plan).

## Out of Scope

- Frontend E2E automation (handled in FE repo).
- Performance/load testing (tracked separately).
- End-user documentation of the APIs; this initiative focuses on enforcement.

## Dependencies / Stakeholders

- **Backend Platform** (owner of scripts, seeds, and API behaviour).
- **Frontend engineering** (consumers; confirm payload expectations and review breaking changes).
- **DevOps / CI** (implements GitHub Actions jobs, handles secrets).
- **QA / Product** (review contract coverage vs. business-critical scenarios).

Blocking dependencies:

- Regenerated OpenAPI spec via `npm run docs:openapi:generate`.
- Stable seed data for analytics/metrics/logs to avoid flaky IDs.
