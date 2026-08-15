# Schemathesis Contract Guide

**Status:** Active
**Last updated:** 2026-04-13

Schemathesis provides spec-driven generative contract coverage complementary to Newman.

## Setup

```bash
python3 -m venv .venv-schemathesis
source .venv-schemathesis/bin/activate
pip install -r tests/contract/schemathesis/requirements.txt
```

## Prerequisites

- OpenAPI artifact is fresh (`npm run docs:openapi:generate`).
- Deterministic seed data exists (`npm run seed:contract-tests`).
- Backend is running and reachable.
- Use `DISABLE_RATE_LIMITING=true` in local fuzzing environments to reduce noise.

## Commands

```bash
npm run test:contract:schemathesis:local
npm run test:contract:schemathesis:local:quick
npm run test:contract:schemathesis:local:gate
npm run test:contract:schemathesis:local:full
npm run test:contract:schemathesis:staging
```

Reports are written under `reports/local|staging/<timestamp>/`.

## Environment Inputs

- Local: `SCHEMATHESIS_LOCAL_TOKEN`, optional local profile overrides.
- Staging: `SCHEMATHESIS_STAGING_BASE_URL`, `SCHEMATHESIS_STAGING_TOKEN`.

## Maintenance Rules

- Keep hooks and profile defaults aligned with runtime validation behavior.
- Log significant failures/findings in `findings.md`, `../incidents.md`, and `../metrics-tracker.md`.
