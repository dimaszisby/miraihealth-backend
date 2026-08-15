# Dependency Management Policy

## Purpose

Establish a predictable, portfolio-grade process for evaluating, triaging, and remediating dependency risks across the Lakira backend. This policy aligns local development, CI, and production expectations so auditors can trace exactly how runtime libraries are kept secure.

## Scope

- **Runtime dependencies** (packages shipped with the service, Docker image, or Render deployment).
- **Dev/test tooling** (lint, jest, newman, postman, etc.) — still tracked, but lower priority unless they compromise CI.
- Direct and transitive packages listed in `package.json` / `package-lock.json`.
- Node.js runtime itself (pinned to `20.x` via `.nvmrc`, `.node-version`, and CI env).

## Roles & Ownership

- **Primary DRI:** Backend maintainer (currently @dimaspramudya).
- **Supporting tooling:** GitHub Dependabot alerts + manual `npm audit`.
- All dependency upgrades must land via PR (no `npm audit fix --force` on main).

## Signals & Tooling

1. **Automated alerts**
   - GitHub Dependabot / Advisory alerts (monitored weekly).
   - CI pipelines (lint/typecheck/test/contract) to detect regressions after upgrades.
2. **Manual sweeps**
   - `npm audit --production` before every release tag or staging deploy.
   - Full `npm audit` (including dev deps) once per sprint or when upgrading entrypoints.
3. **Lockfile discipline**
   - Always commit `package-lock.json`.
   - Re-run `npm install --package-lock-only` when editing versions to avoid surprise sub-dep bumps.

## Severity & Response Targets

| Severity (CVSS / GHSA) | Surface            | Action & Target SLA                                                          |
| ---------------------- | ------------------ | ---------------------------------------------------------------------------- |
| Critical / High        | Runtime dependency | Patch or mitigate ≤ 72h. Hotfix PR allowed.                                  |
| Critical / High        | Dev-only tooling   | Patch in next sprint unless exploit impacts CI secrets.                      |
| Moderate               | Runtime            | Bundle with next planned maintenance window; document rationale if deferred. |
| Moderate / Low         | Dev/Test           | Address during dependency housekeeping tasks; track in checklist/todo.       |

When upstream fixes are unavailable, document compensating controls (feature flags, WAF rules) in `docs/internal/audits/security/` and open backlog issues.

## Workflow

1. **Triage**
   - Classify alert as runtime vs dev.
   - Determine exposed assets (auth, data plane, CI secrets).
   - Decide fix type: version bump, replace package, or remove dependency.
2. **Plan**
   - Create/update a TODO or checklist entry referencing the CVE/GHSA.
   - Note required verification (unit, integration, contract, OpenAPI).
3. **Implement**
   - Update `package.json` / lockfile manually; avoid bulk `--force`.
   - Run `npm run lint`, `npm run typecheck`, `npm run test:integration`, and contract suites if the change touches runtime code.
4. **Review**
   - Include risk summary + links to advisories in PR description.
   - Reference this policy and any tickets/checklists.
5. **Verify**
   - CI must pass (`backend-ci`).
   - `npm run docs:openapi:check` ensures spec stays stable after dependency updates that may alter schema generation.

## Runtime vs Dev/Test Triaging Guidelines

- **Runtime-first:** Prioritize packages such as Express, Sequelize, JSON Web Token utilities, Redis/Postgres clients, and any middleware that processes request payloads.
- **Dev/Test:** Tools like Jest, Newman, Prettier, ESLint are patched on a scheduled cadence unless the vulnerability leaks secrets or allows code execution during CI runs.
- Document categorization in the relevant checklist/todo.

## Upgrade Cadence

- **Monthly:** Run `npm audit --production` and capture findings.
- **Quarterly:** Refresh major dev-tooling train (Jest, ESLint, Newman) in a dedicated PR with release notes, following the doc kit pattern (plan/checklist/decisions).
- **Ad hoc:** Immediately when GitHub reports Critical/High runtime issues.

## Change Control Expectations

- Never run `npm audit fix --force` on main or release branches.
- Each upgrade PR:
  - references advisories or changelog,
  - links to affected docs/checklists,
  - states test evidence.
- If forced downgrades or patch forks are necessary, log a decision entry in `docs/internal/audits/security/audit-2025-11-21/security-audit-log-baseline-simple.md` (or a dedicated `decisions.md` once the dependency topic expands).

## Exceptions

- When upstream fixes are not available:
  - Add temporary suppression note in `docs/reference/security/dependency-policy.md` (this file) or a companion log.
  - Monitor advisory weekly; create a calendar reminder.
  - Prefer defense-in-depth mitigations (rate limiting, schema validation, feature flags).

## References

- Node 20 pinning: `.nvmrc`, `.node-version`, `package.json "engines"`.
- CI enforcement: `.github/workflows/backend-ci.yml`.
- Security audit artifacts: `docs/internal/audits/security/`.

---

## Current Audit Snapshot (2026-01-19)

### Runtime Findings (Resolved 2026-01-19)

| Package / Path                                               | Version (before) | Severity | Surface                                        | Advisory                                                                 | Status                                                                                                                                                                                 |
| ------------------------------------------------------------ | ---------------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qs` via `express` / `body-parser`                           | 6.13.0           | High     | **Runtime** (request parsing)                  | [GHSA-6rw7-vpxm-498p](https://github.com/advisories/GHSA-6rw7-vpxm-498p) | **Resolved 2026-01-19:** upgraded `express` → `4.22.1`, added explicit `body-parser` `^1.20.4`, bumped `express-openapi-validator` → `5.6.1`, verified `npm audit --production` clean. |
| `tar` via `@mapbox/node-pre-gyp` (transitive under `bcrypt`) | 6.1.15           | High     | **Runtime install hook** (native module fetch) | [GHSA-8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97) | **Resolved 2026-01-19:** upgraded `bcrypt` → `6.0.0` (drops `@mapbox/node-pre-gyp`), verified tests + audit clean.                                                                     |

- Snapshot derived from `npm audit --production` executed on **2026-01-19** after applying the fixes above.
- Evidence: `npm run lint`, `npm run typecheck`, and `npm audit --production` all pass on the upgraded dependencies.

### Dev/Test Findings (Open 2026-01-19)

| Package / Path                                                                            | Version | Severity        | Surface                                         | Advisory                                                                                                                                                                                                                     | Status / Plan                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ------- | --------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `diff` via `ts-node` (Jest CLI chain)                                                     | 4.0.2   | High            | **Dev-only** (ts-node used for tooling/scripts) | [GHSA-73rr-hh4g-fpgx](https://github.com/advisories/GHSA-73rr-hh4g-fpgx)                                                                                                                                                     | Await upstream `ts-node` release that bumps to `diff>=5`. Audit fix would downgrade to `ts-node@1.x` (breaking). Monitor npm advisories weekly and upgrade once patch lands.                                                      |
| `newman` transitive deps (`postman-runtime` → `jose`, `node-forge`, `postman-request/qs`) | 6.2.2   | Moderate / High | **Dev-only** (contract test tooling)            | [GHSA-hhhv-q57g-882q](https://github.com/advisories/GHSA-hhhv-q57g-882q), [GHSA-554w-wpv2-vw27](https://github.com/advisories/GHSA-554w-wpv2-vw27), [GHSA-6rw7-vpxm-498p](https://github.com/advisories/GHSA-6rw7-vpxm-498p) | Latest newman still bundles vulnerable transitive packages; `npm audit fix --force` would revert to 6.2.0 (no fix). Track upstream releases and evaluate alternatives (Postman CLI, REST Client) if advisories remain unresolved. |

- These dev-only alerts do **not** ship to production builds, but we keep them documented with owners so we can react once upstream fixes exist.
- Junior devs should reference this table before running `npm audit`; do **not** run `npm audit fix --force` (per policy) because it would downgrade or break the toolchain.
