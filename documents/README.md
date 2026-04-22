# Documents Directory Guide

This README explains how to use and maintain the `documents/` tree.

Audience:

- Developers onboarding to Lakira backend
- Reviewers and maintainers
- LLM/Agents that need deterministic navigation and update rules

## Quick Start

If you are new, read these first:

1. `documents/LLM_CONTEXT.md` (for LLM/agent context control)
2. `documents/documentation/product/README.md`
3. `documents/documentation/product/lakira-backend-prd.md`
4. `documents/documentation/architecture/lakira-backend-routes.md`
5. `documents/documentation/architecture/lakira-backend-db-schema.md`
6. `documents/tests/TESTING_STRATEGY.md`
7. `documents/ci-cd/CI_CD_STRATEGY.md`

## Top-Level Directory Map

| Path                       | Purpose                                         | Typical Contents                                                                | Update When                                                       |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `documents/ci-cd/`         | CI/CD strategy and pipeline operations          | GitHub Actions plans, env matrices, backend/frontend CI docs                    | Pipeline, branch gates, env contracts, or deployment flow changes |
| `documents/code-review/`   | Historical and active code-review outputs       | Review plans, recommendations, archived review artifacts                        | Formal review cycles or post-review archival                      |
| `documents/development/`   | Engineering design and implementation planning  | Architecture plans, migration tracks, feature documentation templates, dev logs | Architecture changes, refactors, or feature-level design updates  |
| `documents/docker/`        | Local/CI container workflow docs                | Postgres Docker guide, Docker test runner plans                                 | Docker compose/runtime/test environment changes                   |
| `documents/documentation/` | Product and architecture reference docs         | PRDs, backend route docs, DB schema docs, OpenAPI/Zod docs                      | API/domain contract changes, product scope changes                |
| `documents/incidents/`     | Incident history and postmortem-style records   | Dated incident reports and index README                                         | Test/prod incident happens or incident index changes              |
| `documents/openapi/`       | Generated API contract artifacts and planning   | `lakira-backend-openapi.json`, OpenAPI planning docs                            | Endpoint/schema changes affecting contract                        |
| `documents/security/`      | Security framework, audits, and policy guidance | Audit runs, templates, dependency policy, security guides                       | Security audits, control updates, or policy/process changes       |
| `documents/tests/`         | Test strategy and testing program docs          | Static/unit/integration/contract test plans, checklists, tool guidance          | Test architecture/process/coverage-gate changes                   |
| `documents/todos/`         | Actionable dated backlog notes                  | Time-stamped TODO docs for specific maintenance items                           | New technical debt/tasks are tracked or resolved                  |

## Root Files

| Path                       | Purpose                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `documents/LLM_CONTEXT.md` | Canonical include/exclude context contract for LLM/agent runs to keep token usage low.  |
| `documents/__init__.py`    | Marker file for Python tooling that imports from `documents/tests` hooks and utilities. |

## Update Rules (For Devs and Agents)

1. Update the nearest source-of-truth doc, not only a planning doc.
2. Prefer editing existing docs over creating duplicates.
3. Keep file names date-prefixed for logs/incidents/todos when chronology matters (`YYYY-MM-DD-*`).
4. When API behavior changes, update all three together:
   - `documents/documentation/architecture/lakira-backend-routes.md`
   - `documents/openapi/lakira-backend-openapi.json`
   - relevant PRD in `documents/documentation/product/`
5. Treat `archive/` folders as historical unless explicitly asked to revise them.
6. If you add a new major folder under `documents/`, update this README in the same change.

## Recommended Navigation by Task

- Understand product scope: `documents/documentation/product/`
- Understand current API contracts: `documents/documentation/architecture/` + `documents/openapi/`
- Understand test gates: `documents/tests/`
- Understand release/deploy flow: `documents/ci-cd/`
- Understand security posture: `documents/security/`
- Investigate prior failures: `documents/incidents/`
- Review historical engineering decisions: `documents/development/` and `documents/code-review/`

## Notes for LLM/Agents

- Read `documents/LLM_CONTEXT.md` first for include/exclude rules.
- Start from normative docs before plans/checklists.
- Prefer backend docs over frontend docs in this repository unless task explicitly targets frontend.
- Do not infer production behavior from TODO/plan docs without checking architecture/product docs.
- When creating new docs, add clear ownership and timestamps when appropriate.
- Default context pack for API/product tasks:
  - `documents/documentation/product/lakira-backend-prd.md`
  - `documents/documentation/architecture/lakira-backend-routes.md`
  - `documents/documentation/architecture/lakira-backend-db-schema.md`
  - `documents/openapi/lakira-backend-openapi.json`
- Exclude high-volume reference dumps by default unless explicitly requested:
  - `documents/documentation/code-for-export-reference/**`
  - `documents/development/architecture/feature-vertical-slice-migration/logs/**`
