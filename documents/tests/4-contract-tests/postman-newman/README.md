# Postman/Newman Contract Guide

**Status:** Active
**Last updated:** 2026-04-13

This folder contains curated contract suites executed by Newman for deterministic API checks.

## What it validates

- endpoint availability + status codes
- response envelopes and key fields
- auth guard behavior
- analytics caching headers (`ETag`, `Cache-Control`) where expected

## Commands

```bash
npm run test:contract:local
npm run test:contract:staging
```

- Local script seeds fixtures by default and writes reports under `reports/local/<timestamp>/`.
- Staging script reads `STAGING_*` environment variables and writes reports under `reports/staging/<timestamp>/`.

## Required staging inputs

- `STAGING_BASE_URL`
- `STAGING_CONTRACT_TOKEN`
- seeded ID secrets (`STAGING_CATEGORY_*`, `STAGING_METRIC_*`, `STAGING_METRIC_SETTINGS_*`, `STAGING_METRIC_LOG_*`)

See `STAGING_RUNBOOK.md` for deploy-hook and rotation workflow.

## Maintenance Rules

- Keep collections aligned with `documents/openapi/lakira-backend-openapi.json` and runtime behavior.
- Update assertions when endpoint contracts change.
- Keep reports upload paths stable for CI triage.

## Related Docs

- `PLAN.md`
- `CHECKLIST.md`
- `WORKFLOW_GUIDELINES.md`
- `PIPELINE_OVERVIEW.md`
- `STAGING_RUNBOOK.md`
