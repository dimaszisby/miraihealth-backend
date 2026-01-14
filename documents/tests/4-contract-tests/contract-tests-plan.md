# Contract Tests Plan – Lakira Backend

## Context & Goals

- Integration tests (Phase 3) are stable and documented under `documents/tests/3-integration-tests/**`. The CI/CD strategy promotes contract tests as the next maturity step before there is confidence to deploy from GitHub Actions to Render.
- Existing contract-test assets are skeletal: Postman collections/environments exist but contain no requests, Schemathesis folders are empty, and Newman scripts referenced in `package.json` are missing.
- The goal of this plan is to move from documentation placeholders to a **portfolio-grade, automated contract layer** that:
  - Gives frontend teams a reliable contract gate for analytics, metrics, logs, settings, and auth endpoints.
  - Adds specification-driven fuzzing (Schemathesis) to find schema drift before production.
  - Integrates with CI/CD (`contract_local`, `contract_staging`, plus nightly fuzzing) with clear artifacts and rollback guidance.
  - Captures progress via checklist + metrics so reviewers can see maturity at a glance.

## Current State Snapshot (2026-01-14)

- ✅ Documentation scaffolding exists: Postman README/PLAN/CHECKLIST, workflow + pipeline notes.
- ⚠️ Postman collections, env files, and Newman scripts are empty.
- ⚠️ Schemathesis plan/checklist files are zero-byte placeholders.
- ⚠️ CI jobs for contract tests are planned but not yet implemented in `.github/workflows/backend-ci.yml`.
- ⚠️ No seeds, fixtures, or metrics are tracked for contract testing today.

## Phases & Milestones

1. **Phase 0 – Audit & Doc Kit (complete – 2026-01-14)**

   - Inventory existing docs, confirm scope with integration plan + CI/CD strategy.
   - Create the contract-test documentation kit (README, plan, checklist, ticket, decisions, incidents, metrics).
   - Define owner expectations and link supporting Postman + Schemathesis folders.

2. **Phase 1 – Postman/Newman Foundation (in progress)**

   - Finalize deterministic contract-test seeds (users, categories, metrics, metric settings, logs) via `npm run seed:contract-tests` and record variables in environment JSON files.
   - ✅ (2026-01-14) Base Postman collections for analytics, metrics, metric logs, metric settings, and auth now cover happy-path requests + key assertions driven by the seeded data.
   - ✅ (2026-01-14) Created Newman runner scripts (`run-contract-local.js`, `run-contract-staging.js`) wired to `npm run test:contract:<env>`; local script seeds automatically, staging script pulls secrets from `STAGING_*` env vars, and both store reports under `postman-newman/reports/<env>/<timestamp>/`.
   - Document local workflow + troubleshooting in `postman-newman/README.md` + CHECKLIST.
   - Deliverable: local command green, artifacts stored under `postman-newman/reports/local`, and checklist Phase 1 complete.

3. **Phase 2 – Negative Coverage, Headers, & Schemathesis Kickoff**

   - Expand Postman suites with validation errors, auth failures, cache/ETag checks, and not-found scenarios per checklist.  
     ✅ (2026-01-14) Collections now include 400/401/404 flows plus conditional requests for analytics dashboard/visualizations.
   - Implement JSON Schema snippets or Postman test scripts mirroring OpenAPI definitions for analytics dashboard payloads.  
     ✅ (2026-01-14) Dashboard happy-path request validates key fields/arrays before persisting the response `ETag`.
   - ✅ (2026-01-14) Stand up Schemathesis CLI scripts: `npm run test:contract:schemathesis:local|staging` now call Node wrappers that enforce OpenAPI freshness, seeded tokens, and timestamped report folders under `schemathesis/reports/<env>/`.
   - ✅ (2026-01-14) Schemathesis plan/checklist refreshed and backed by a dedicated README + `requirements.txt` so contributors can install the CLI, understand env vars, and log coverage/triage steps before nightly adoption.
   - ✅ (2026-01-14) Captured the first local Schemathesis run (112 failures across schema drift, missing 405 responses, and aggressive rate limiting). Reports: `schemathesis/reports/local/2026-01-14T08-19-10-426Z/` with HAR + JUnit artifacts; incidents + tracker updated with follow-ups (disable rate limiter for fuzzing, align response envelopes with OpenAPI).
   - ✅ (2026-01-14) Added `DISABLE_RATE_LIMITING` env flag + documentation so contract/Schemathesis runs can bypass throttling without impacting other environments.
   - Deliverable: nightly (manual) local fuzzing run documented with sample report + metrics entry.

4. **Phase 3 – CI/CD Integration & Enforcement**

   - Implement GitHub Actions jobs `contract_local`, `deploy_staging`, and `contract_staging` exactly as described in `documents/ci-cd/backend/GITHUB_ACTIONS_PIPELINE_PLAN.md`.
   - Add caching + artifact upload logic for both Newman and Schemathesis runs.
   - Wire secrets (`STAGING_BASE_URL`, `STAGING_AUTH_TOKEN`, etc.) and document in CI README.
   - Configure branch protections so PRs require `contract_local` success; optionally gate `main` merges on `contract_staging`.
   - Update pipeline overview + README to reflect actual commands + report locations; drop screenshots/artifacts in repo for reference.

5. **Phase 4 – Nightly Schemathesis & Portfolio Hardening**
   - Schedule nightly Schemathesis job (cron) for staging environment; capture failures in incidents log + metrics tracker.
   - Introduce Slack/email notifications for contract failures (documented in plan + CI doc).
   - Evaluate adding performance budgets to contract reports (response time thresholds) and log any ADR decisions.
   - After ≥2 weeks of stable runs, consider tightening merge gates (e.g., require Schemathesis success on main) and update decisions accordingly.

## Success Metrics

- 100% of externally consumed endpoints represented in Postman collections with at least one happy-path + negative test.
- Newman runtime ≤10 minutes locally, ≤12 minutes in CI, with reports uploaded for every run.
- Schemathesis exercises ≥90% of documented paths with <1% flaky failures week-over-week.
- CI pipeline enforces contract tests before staging deploy; staging job blocks promotion if contracts fail.
- Documentation (plan + checklist + README) stays in sync with actual commands, env vars, and troubleshooting steps.

See `metrics-tracker.md` for quantitative targets and owners.

## Risks & Mitigations

- **Seed Drift:** If contract data relies on ad-hoc scripts, IDs may change. _Mitigation:_ create dedicated `contract-test-seed` script that resets data and outputs stable IDs consumed by env files.
- **Runtime Creep:** Running five collections + Schemathesis could exceed CI limits. _Mitigation:_ parallelize Newman execution, use `--delay-request` sparingly, and keep Schemathesis in a separate nightly job if runtime becomes an issue.
- **Flaky Staging Auth:** Tokens may expire, causing red builds. _Mitigation:_ rely on service accounts or dynamic login helpers within scripts; document rotation cadence.
- **Spec/Implementation Drift:** OpenAPI not updated before Schemathesis runs could yield false positives. _Mitigation:_ enforce `docs:openapi:check` in CI and require spec updates in PR template.
- **Documentation Rot:** Without owners, README/checklist may fall behind. _Mitigation:_ tie checklist updates to PR review and include doc paths in `CODEOWNERS`.

## Open Questions

1. **Do we run Schemathesis on every PR or nightly?**  
   Default assumption: nightly on `main` to keep PR feedback fast; revisit after runtime data is captured (Phase 3 deliverable).

2. **Where should contract-test seed data live?**  
   Resolved 2026-01-14: `scripts/seed-contract-tests.ts` provisions deterministic fixtures and outputs `tmp/contract-seed.json`, with mapping documented in `seed-strategy.md`.

3. **Do we gate production deploys on staging contract tests?**  
   To be decided with DevOps once staging reliability is proven; update CI doc + ADR when finalized.

## Phase 1 Kickoff Notes (2026-01-14)

- **Seed script (`npm run seed:contract-tests`):** implemented under `scripts/seed-contract-tests.ts`. It truncates contract tables, creates deterministic users/categories/metrics/settings/logs, signs JWTs, and writes outputs to `tmp/contract-seed.json` for Postman environments to consume.
- **Environment variable schema:** `documents/tests/4-contract-tests/postman-newman/environments/lakira-local.postman_environment.json` ships with placeholders referencing the seed output. The staging environment uses `{{STAGING_*}}` tokens so CI can inject real values. See `seed-strategy.md`.
- **Workflow sequencing:**
  1. Run `npm run db:migrate:test` followed by `npm run seed:contract-tests`.
  2. Sync Postman env JSON with the generated IDs/tokens (local file uses actual values, staging remains templated for CI secrets).
  3. Wire the seeding command into local + CI workflows before Newman executes (`scripts/test-ci.sh` update pending).
