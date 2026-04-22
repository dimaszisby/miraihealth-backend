# Security Audit Workflow (dev -> staging -> main)

**Status:** Active
**Last updated:** 2026-04-13

Security evidence must match the exact promoted code.

## Branch Roles

- `dev`: early detection and remediation during feature work.
- `staging`: release-candidate security sign-off (authoritative release evidence).
- `main`: receives only reviewed/promoted changes.

## Standard Flow

1. On `dev`, run framework tests and delta gate for ongoing changes.
2. On `staging`, run release delta commands and confirm gate pass.
3. Record evidence in active audit run docs.
4. Promote to `main` only after staging security evidence is green.

## Required Commands

```bash
npm run test:unit:security-framework
npm run security:delta:gate
```

## Required Audit Doc Updates after staging run

- `README.md` (status snapshot)
- `audit-checklist.md`
- `findings-log.md`
- `remediation-plan.md`
- `metrics-tracker.md`
- `portfolio-summary.md` (sanitized)

## Guardrails

- Do not rely on `dev` evidence alone for release sign-off.
- Do not bypass blockers by editing policy ad hoc.
- Keep CI-required checks and CODEOWNERS review enforced.
