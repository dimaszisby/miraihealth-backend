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

## Transitive Overrides

Some advisories live in a transitive package whose parent pins an outdated version and has no
newer release. `npm audit fix` cannot resolve these, and `npm audit fix --force` "fixes" them by
proposing a **downgrade of the top-level package** — which is destructive (see the warning under
Exceptions).

For these, use an `overrides` block in `package.json` to pin the vulnerable leaf to its patched
version, leaving the parent's version untouched.

Rules for adding an override:

1. **Same major only.** A patch or minor bump within the major the parent already depends on.
   Crossing a major is not an override decision — it is a dependency upgrade, with its own testing.
2. **Verify the consuming code path.** Confirm what the parent actually uses the package for, and
   whether our code reaches it. Record the finding in the PR.
3. **Never pin below the latest safe version.** An exact pin that is lower than what another
   dependency already resolves will _downgrade_ that dependency and can introduce new advisories.
   Check the full advisory range, not just the one you are fixing.
4. **Re-run the full suite.** Overrides force a version past a declared constraint, so
   `npm test` plus `npm run test:contract:local` are required evidence.
5. **Prefer removal.** If the parent is itself unnecessary, drop it instead of overriding it.

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

## Superseded Snapshot (2026-01-19)

> Superseded by the 2026-08-23 snapshot below. Retained as a record of what was true then.

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

## Current Audit Snapshot (2026-08-23)

Full `npm audit`: **9 moderate, 0 critical, 0 high, 0 low** (from 25: 1 critical, 12 high,
11 moderate, 1 low).
`npm audit --production`: **2 moderate, 0 high/critical** — the value the CI gate evaluates.

### What changed

The `newman` contract-test chain carried 1 critical and 11 of the 12 highs. `newman@6.2.2` and
`newman-reporter-htmlextra@1.23.1` were both already the latest published releases, so no upgrade
existed. Resolved by pinning the patched transitive leaves via `overrides` (see Transitive
Overrides above) and removing the reporter:

| Override                | Reason                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handlebars` 4.7.9      | Cleared the **critical** (AST type confusion, `>=4.0.0 <=4.7.8`). Reachable via **two** paths — `newman-reporter-htmlextra` _and_ `newman` → `postman-runtime`. Used only by `postman-runtime`'s `pm.visualizer`, which no collection uses. |
| `lodash` 4.18.1         | High — code injection via `_.template`.                                                                                                                                                                                                     |
| `underscore` 1.13.8     | High — unbounded recursion; also clears `httpntlm`.                                                                                                                                                                                         |
| `node-forge` 1.4.0      | High — ASN.1 unbounded recursion.                                                                                                                                                                                                           |
| `flatted` 3.4.4         | High — unbounded recursion in `parse()`; also clears `uvm`.                                                                                                                                                                                 |
| `js-yaml` 3.15.1        | High — quadratic CPU in `!!omap` resolution.                                                                                                                                                                                                |
| `brace-expansion` 2.1.4 | High — DoS via unbounded intermediate arrays.                                                                                                                                                                                               |
| `ip-address` 10.5.0     | High — leading-zero octets decoded as decimal.                                                                                                                                                                                              |
| `qs` 6.15.3             | Moderate — `qs.stringify` DoS (`>=6.11.1 <=6.15.1`). **Must be 6.15.2+**: an earlier pin downgrades `express`/`body-parser`, which already resolve a safe version, and re-introduces the advisory in **production**.                        |
| `jose` 4.15.5           | Moderate — resource exhaustion.                                                                                                                                                                                                             |
| `esbuild` 0.28.2        | Low — arbitrary file read via dev server.                                                                                                                                                                                                   |

`newman-reporter-htmlextra` was removed outright: no CI step consumed its HTML output, and it
pulled in the `@budibase/handlebars-helpers` subtree. `tests/contract/postman-newman/scripts/run-contract-local.js`
now reports via the built-in `cli` + `junit` reporters only.

### Remaining 9 (all moderate, all dev-surface except two)

Every remaining finding has a single root: **`uuid` < 11.1.1** (missing buffer bounds check in
`v3`/`v5`/`v6` when `buf` is provided). It surfaces as `uuid` plus the packages that depend on it —
`sequelize`, `jest-junit`, `serialised-error`, `postman-collection`, `postman-request`,
`postman-runtime`, `postman-sandbox`, `newman`.

**Deliberately not overridden.** The fix requires `uuid@>=11.1.1`, but `sequelize@6` — a
**production** dependency — resolves `uuid@8.3.2`. Forcing 8 → 11 crosses three majors on the ORM
to fix a bounds check in code paths we do not call (`src/` imports `uuid` nowhere; Sequelize uses
only `uuid.v1`/`uuid.v4`). Per rule 1 under Transitive Overrides this is a dependency upgrade
decision, not an override. Revisit when Sequelize bumps its own constraint.
