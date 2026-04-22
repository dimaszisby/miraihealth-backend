# Security Documentation Index

**Status:** Active
**Last updated:** 2026-04-13

This directory contains Lakira backend security policy, framework, guides, and audit-run records.

## Canonical Start Points

1. `documents/security/framework/security-audit-framework.md`
2. `documents/security/framework/security-audit-master-checklist.md`
3. `documents/security/DEPENDENCY_POLICY.md`
4. `documents/security/audit/index.md`
5. `documents/security/guides/README.md`

## Folder Map

- `framework/`: baseline controls, scoring, evidence and exception policy.
- `templates/audit-run/`: reusable audit-run document kit.
- `audit/`: dated audit run records.
- `guides/`: operator and onboarding guides.

## Audit Cadence

- Full audit: quarterly.
- Delta audit: before production release.
- Additional delta audit: after major incidents/architecture shifts.

## Update Rules

- Keep control and policy docs synchronized with CI gate behavior.
- Keep `audit/index.md` current whenever a run status changes.
- Prefer updating canonical docs over creating new overlapping guidance files.

## LLM Context Guidance

Default include set for security tasks:

- `documents/security/README.md`
- `documents/security/framework/security-audit-framework.md`
- `documents/security/framework/security-audit-master-checklist.md`
- `documents/security/DEPENDENCY_POLICY.md`
- active audit run README + findings/remediation docs only (if task is run-specific)

Default exclusions unless explicitly requested:

- historical detailed audit artifacts under `documents/security/audit/audit-*/**`
- template files when task is investigating an existing run
