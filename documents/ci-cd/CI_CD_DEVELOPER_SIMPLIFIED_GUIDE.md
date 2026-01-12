# CI/CD Developer Simplified Guide

This guide explains how Lakira Backend’s automation works and what a junior developer should do locally before committing or opening a pull request. Use it as a quick reference when contributing new features or fixing bugs.

## 1. Pipeline Overview

1. **Static Checks (job: `checks`)**
   - `npm run lint`
   - `npm run lint:tests` (fast guardrail for `__tests__/**`)
   - `npm run format:check`
   - `npm run typecheck`
   - `npm run docs:openapi:check`
2. **Unit Tests**
   - `npm run test:unit` (enforces ≥ 60 % statements / ≥ 40 % branches / ≥ 55 % functions / ≥ 60 % lines via `jest.config.mjs`)
   - `npm run test:unit:coverage` (coverage artifacts moved to `coverage/jest-unit` and `coverage/junit/unit.xml`, both uploaded)
3. **Integration Tests**
   - `npm run test:integration` (runs sequentially with `NODE_ENV=test`)
4. **Contract / E2E (optional per PR)**
   - `npm run test:contract:local` or staging variant when requested by QA.

Jobs run in the order above; a failure in any stage blocks later jobs so issues are caught early.

## 2. Local Pre-Commit / Pre-PR Checklist

Before committing or opening a PR:

1. `npm install` (after pulling main) to stay aligned with lockfile.
2. `npm run lint` – ensure repo-wide ESLint passes.
3. `npm run lint:tests` – quickly validate the Jest env guardrail.
4. `npm run format:write` – fix formatting locally before `format:check` runs in CI.
5. `npm run typecheck` – catch TS errors.
6. `npm run test:unit` (always; fails fast if coverage slips below thresholds) and `npm run test:unit:coverage` if touching high-risk paths.
7. `npm run test:integration` when persistence, HTTP wiring, or migrations are touched.
8. For API/schema updates: `npm run docs:openapi:check` and commit spec changes if needed.
9. Stage files and let Husky run `npm run lint-staged` (ESLint + Prettier on staged files) before the commit is created.

Document command outputs or screenshots in the PR description for easier reviewer triage.

## 3. Developer Environment Expectations

- **Node/npm**: Node 18 LTS, npm 11.x (matches `.nvmrc` + `@tsconfig/node18`).
- **Env files**: `.env.test` for local tests; other environments handled via `dotenv` scripts.
- **Databases**: Unit/static checks do not require DB access; integration tests expect Postgres/Redis reachable using the values in `.env.test`.
- **Tooling**: Husky is installed via `npm install` (`prepare` script). Disable only with team approval (CI is the source of truth).

## 4. CI Failure Playbook

| Stage             | Typical Failure Causes                                  | What To Do                                                                      |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Static checks     | Lint/type errors, formatting drift, OpenAPI diffs       | Re-run same command locally, fix, re-run `npm run lint` & `npm run lint:tests`. |
| Unit tests        | Missing coverage, flaky mocks, updated business logic   | Add/update suites under `__tests__/unit/**`, ensure `withTestEnv` usage.        |
| Integration tests | DB migrations, Sequelize schema drift, HTTP regressions | Re-run `npm run test:integration`, check migrations and seed data.              |
| Contract/E2E      | API schema mismatch, environment drift                  | Coordinate with QA, update Postman collection or feature behavior as needed.    |

Always push fixes to the same branch; reruns are automatic once CI detects new commits.

## 5. Branching & PR Hygiene

- Branch from `development` (or the branch the team specifies).
- Align commit messages with the issue/ticket ID when possible.
- Keep PRs small and focused; describe changes + commands you ran.
- If you skip a test due to timeline pressure, note it in the PR and create a TODO in `documents/todos/`.

## 6. Useful Scripts Reference

| Script                       | Purpose                                                   |
| ---------------------------- | --------------------------------------------------------- |
| `npm run lint`               | ESLint full repo                                          |
| `npm run lint:fix`           | ESLint auto-fix                                           |
| `npm run lint:tests`         | ESLint scoped to `__tests__/**` guardrail                 |
| `npm run format:write`       | Prettier auto-format                                      |
| `npm run typecheck`          | TypeScript `--noEmit`                                     |
| `npm run test:unit`          | Jest unit project                                         |
| `npm run test:unit:coverage` | Jest unit coverage                                        |
| `npm run test:integration`   | Jest integration project                                  |
| `npm run docs:openapi:check` | Regenerate and diff OpenAPI spec                          |
| `npm run lint-staged`        | Pre-commit automation (eslint + prettier on staged files) |

## 7. Escalation & Support

- **Docs**: `documents/tests/**`, `documents/ci-cd/backend/**`, `documents/development/architecture/**`.
- **Owner**: Backend Platform (@dimaspramudya). Reach out for CI failures or infrastructure issues.
- **Incident logging**: If an issue reaches `main`/production, record it in `documents/incidents/` with root cause and remediation steps.

Consistently following these steps demonstrates production-grade discipline and builds a strong portfolio narrative around CI/CD ownership.
