# Documents Directory Guide

This README explains how to use and maintain the `docs/` tree.

Audience:

- Developers onboarding to Lakira backend
- Reviewers and maintainers
- LLM/Agents that need deterministic navigation and update rules

## Quick Start

If you are new, read these first:

1. `docs/documentation/product/lakira-backend-prd.md`
2. `docs/documentation/architecture/lakira-backend-routes.md`
3. `docs/documentation/architecture/lakira-backend-db-schema.md`
4. `docs/tests/TESTING_STRATEGY.md`
5. `docs/ci-cd/CI_CD_STRATEGY.md`

## Top-Level Directory Map

| Path                  | Purpose                                         | Typical Contents                                                                | Update When                                                       |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `docs/ci-cd/`         | CI/CD strategy and pipeline operations          | GitHub Actions plans, env matrices, backend/frontend CI docs                    | Pipeline, branch gates, env contracts, or deployment flow changes |
| `docs/code-review/`   | Historical and active code-review outputs       | Review plans, recommendations, archived review artifacts                        | Formal review cycles or post-review archival                      |
| `docs/development/`   | Engineering design and implementation planning  | Architecture plans, migration tracks, feature documentation templates, dev logs | Architecture changes, refactors, or feature-level design updates  |
| `docs/docker/`        | Local/CI container workflow docs                | Postgres Docker guide, Docker test runner plans                                 | Docker compose/runtime/test environment changes                   |
| `docs/documentation/` | Product and architecture reference docs         | PRDs, backend route docs, DB schema docs, OpenAPI/Zod docs                      | API/domain contract changes, product scope changes                |
| `docs/incidents/`     | Incident history and postmortem-style records   | Dated incident reports and index README                                         | Test/prod incident happens or incident index changes              |
| `docs/openapi/`       | Generated API contract artifacts and planning   | `lakira-backend-openapi.json`, OpenAPI planning docs                            | Endpoint/schema changes affecting contract                        |
| `docs/security/`      | Security framework, audits, and policy guidance | Audit runs, templates, dependency policy, security guides                       | Security audits, control updates, or policy/process changes       |
| `docs/tests/`         | Test strategy and testing program docs          | Static/unit/integration/contract test plans, checklists, tool guidance          | Test architecture/process/coverage-gate changes                   |
| `docs/todos/`         | Actionable dated backlog notes                  | Time-stamped TODO docs for specific maintenance items                           | New technical debt/tasks are tracked or resolved                  |

## Update Rules (For Devs and Agents)

1. Update the nearest source-of-truth doc, not only a planning doc.
2. Prefer editing existing docs over creating duplicates.
3. Keep file names date-prefixed for logs/incidents/todos when chronology matters (`YYYY-MM-DD-*`).
4. When API behavior changes, update all three together:
   - `docs/documentation/architecture/lakira-backend-routes.md`
   - `docs/openapi/lakira-backend-openapi.json`
   - relevant PRD in `docs/documentation/product/`
5. Treat `archive/` folders as historical unless explicitly asked to revise them.
6. If you add a new major folder under `docs/`, update this README in the same change.

## Recommended Navigation by Task

- Understand product scope: `docs/documentation/product/`
- Understand current API contracts: `docs/documentation/architecture/` + `docs/openapi/`
- Understand test gates: `docs/tests/`
- Understand release/deploy flow: `docs/ci-cd/`
- Understand security posture: `docs/security/`
- Investigate prior failures: `docs/incidents/`
- Review historical engineering decisions: `docs/development/` and `docs/code-review/`

## Notes for LLM/Agents

- Start from normative docs before plans/checklists.
- Prefer backend docs over frontend docs in this repository unless task explicitly targets frontend.
- Do not infer production behavior from TODO/plan docs without checking architecture/product docs.
- When creating new docs, add clear ownership and timestamps when appropriate.
- Default context pack for API/product tasks:
  - `docs/documentation/product/lakira-backend-prd.md`
  - `docs/documentation/architecture/lakira-backend-routes.md`
  - `docs/documentation/architecture/lakira-backend-db-schema.md`
  - `docs/openapi/lakira-backend-openapi.json`
- Exclude high-volume reference dumps by default unless explicitly requested:
  - `docs/documentation/code-for-export-reference/**`
  - `docs/development/architecture/feature-vertical-slice-migration/logs/**`
