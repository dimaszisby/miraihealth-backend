# Security Audit Run - 2026-02-18

- Generated (UTC): 2026-02-18T09:05:00Z
- Scope: Backend codebase, dependencies, CI/CD, runtime hardening
- Baseline: OWASP ASVS L2, OWASP Top 10, NIST SSDF

## Audit Status

- Current state: Completed with remaining dependency remediation
- Gate status: Pass (soft gate has 0 unresolved high/critical findings)

## Summary

This is the first framework-driven audit run under the reusable security documentation and automation model. It reconciles historical findings from the 2025-11-21 audit set and adds current-cycle delta checks.

Current cycle highlights:

- Findings total: 3 (High: 0, Medium: 2, Low: 1)
- Blocking findings: 0
- Resolved in-cycle:
  - `SEC-20260218-001` (profile role mutation risk)
  - `SEC-20260218-002` (CORS PATCH mismatch)
- Automated artifacts generated:
  - `tmp/security/security-delta-report.json`
  - `tmp/security/security-gate-result.json`
  - `tmp/security/npm-audit-production.json`

## Artifact Index

- [Audit Plan](./audit-plan.md)
- [Audit Checklist](./audit-checklist.md)
- [Threat Model](./threat-model.md)
- [Control Matrix](./control-matrix.md)
- [Findings Log](./findings-log.md)
- [Remediation Plan](./remediation-plan.md)
- [Decisions](./decisions.md)
- [Incidents](./incidents.md)
- [Metrics Tracker](./metrics-tracker.md)
- [Portfolio Summary](./portfolio-summary.md)

## Scope Notes

- In scope: Express routes/middleware, auth/authz flows, config hardening, dependency posture, CI gate enforcement.
- Out of scope: Frontend code and external compliance attestations.

## Definition of Done

- All required artifacts are present and internally consistent.
- Open findings have owners, SLA dates, and remediation targets.
- CI gate output is attached and reflected in findings/remediation status.
