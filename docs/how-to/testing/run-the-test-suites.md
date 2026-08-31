# Tests Documentation Index

**Status:** Active
**Last updated:** 2026-04-13

This folder documents the Lakira backend testing pyramid and the execution rules used in local runs and CI.

## Before you run anything

`npm test` reads `.env.test`, which is gitignored and absent on a fresh clone:

```bash
cp .env.test.example .env.test
```

`scripts/bootstrap-fork.sh` creates it for you; a plain clone does not.

## Canonical Start Points

1. `docs/explanation/testing-strategy.md`
2. `docs/internal/initiatives/tests-1-static-checks/README.md`
3. `docs/internal/initiatives/tests-2-unit-tests/README.md`
4. `docs/internal/initiatives/tests-3-integration-tests/README.md`
5. `docs/internal/initiatives/tests-4-contract-tests/README.md`

## Test Layers

- `1-static-checks/`: lint, typecheck, formatting, OpenAPI drift checks.
- `2-unit-tests/`: in-memory/domain/use-case/controller unit tests with mocks.
- `3-integration-tests/`: real app + Postgres (and optional Redis) tests.
- `4-contract-tests/`: Schemathesis API contract enforcement.
- `overhaul/`: historical restructuring artifacts.
- Top-level dated docs: historical snapshots and recommendations.

## Update Rules

- Keep commands aligned with `package.json` scripts and CI workflow behavior.
- Prefer updating existing canonical docs over adding new overlapping docs.
- When a layer’s command, gate, or ownership changes, update that layer README and `TESTING_STRATEGY.md` in the same PR.
- Treat dated `YYYY-MM-DD` docs as historical unless explicitly reactivated.

## LLM Context Guidance

For test-task prompts, include only:

- `docs/explanation/testing-strategy.md`
- the specific layer README (`1-static`, `2-unit`, `3-integration`, or `4-contract`)
- any directly relevant checklist/plan file for that layer

Exclude by default:

- `docs/internal/initiatives/tests-overhaul/**`
- dated historical docs (`test-*-2025-*.md`) unless the task asks for history.
