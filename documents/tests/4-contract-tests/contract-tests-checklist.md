# Contract Tests Checklist – Lakira Backend

Use this checklist to track the contract-test program end-to-end (Postman/Newman + Schemathesis). Update the owner + date + reference PR/commit when completing each item.

---

## Phase 0 – Audit & Documentation Scaffolding ✅ (2026-01-14)

- [x] Inventory existing Postman/Schemathesis assets and note gaps in plan — owner: @dimaspramudya (2026-01-14)
- [x] Create top-level doc kit (`README`, plan, checklist, ticket, decisions, incidents, metrics) — owner: Codex assist (2026-01-14)
- [x] Link CI/CD documentation + integration-test references from README — owner: Codex assist (2026-01-14)

---

## Phase 1 – Postman/Newman Foundation (In Progress)

- [x] Implement deterministic contract-test seed script exporting stable IDs/tokens for users, categories, metrics, metric settings, and logs (see `seed-strategy.md`) — owner: Codex assist (2026-01-14) [`npm run seed:contract-tests` → `tmp/contract-seed.json`].
- [x] Populate `environments/lakira-local.postman_environment.json` with local base URL + fixture IDs — owner: Codex assist (2026-01-14) (IDs from deterministic seed constants; token sourced from `tmp/contract-seed.json`).
- [x] Populate `environments/lakira-staging.postman_environment.json` with placeholder variables (real secrets injected via CI) — owner: Codex assist (2026-01-14) (`{{STAGING_*}}` variables documented for GitHub Actions secrets).
- [x] Author base requests for every endpoint group (analytics, metrics, metric-logs, metric-settings, auth) covering happy paths — owner: Codex assist (2026-01-14) (`documents/tests/4-contract-tests/postman-newman/collections/*.json` populated).
- [x] Add Postman tests to assert status codes, JSON schema, and key headers for each happy path — owner: Codex assist (2026-01-14) (collections assert success envelope, required headers, and seeded IDs).
- [x] Write Newman runner scripts (`scripts/run-contract-local.js`, `scripts/run-contract-staging.js`) invoked by package.json scripts — owner: Codex assist (2026-01-14) (scripts seed local DB, enforce staged env vars, and call Newman sequentially).
- [x] Store Newman reports under `postman-newman/reports/local|staging` with CLI + HTML outputs — owner: Codex assist (2026-01-14) (runner scripts create timestamped folders with `.html` + `.xml` per collection).
- [x] Update Postman README/checklist with setup steps + troubleshooting — owner: Codex assist (2026-01-14) (README sections 6–11 describe local/staging runners, env vars, and runtime variables).

---

## Phase 2 – Negative Coverage & Schemathesis Kickoff

- [ ] Extend collections with validation/auth/not-found scenarios per endpoint checklist.
- [ ] Add ETag + Cache-Control assertions for analytics dashboard + visualization requests.
- [ ] Introduce JSON Schema snippets or scripted validators for dashboard payloads.
- [ ] Finalize Schemathesis CLI scripts for local + staging (commands + npm scripts).
- [ ] Create Schemathesis run plan/checklist with failure triage workflow.
- [ ] Capture first Schemathesis report and log runtime + findings in metrics tracker.

---

## Phase 3 – CI/CD Integration & Enforcement

- [ ] Implement `contract_local`, `deploy_staging`, `contract_staging` jobs in `.github/workflows/backend-ci.yml` per CI plan.
- [ ] Inject staging secrets via GitHub Actions + document rotation steps.
- [ ] Upload Newman (and later Schemathesis) artifacts from CI to `newman-*/` artifact names.
- [ ] Require `contract_local` job for PR merges; document gating in README + CI plan.
- [ ] Run staging contract tests end-to-end (deploy → test) at least once and document results in metrics tracker.

---

## Phase 4 – Nightly Schemathesis & Portfolio Hardening

- [ ] Schedule nightly (cron-based) Schemathesis job on `main` hitting staging base URL.
- [ ] Configure alerting (Slack/email) for contract test failures; link runbook in README.
- [ ] Track weekly runtime, pass rate, and defect counts in metrics tracker.
- [ ] Evaluate expanding coverage to partner/3rd-party consumers; log ADR if scope changes.
- [ ] Document rollback / disablement procedure for contract tests in incidents or README.

---

## Persistent Maintenance Tasks

- [ ] Update Postman collections + Schemathesis configs whenever OpenAPI/spec changes (tie to PR template).
- [ ] Refresh environment files/tokens quarterly or when test accounts rotate.
- [ ] Review `decisions.md` + `incidents.md` each sprint to ensure new learnings are logged.
- [ ] Keep `metrics-tracker.md` current after every CI run that meaningfully changes runtime or coverage numbers.
