# Security Audit Run - 2026-02-18

- Generated (UTC): 2026-02-18T08:36:30Z
- Scope: Backend codebase, dependencies, CI/CD, runtime hardening
- Baseline: OWASP ASVS L2, OWASP Top 10, NIST SSDF

## Audit Status

- Current state: Completed with open remediation
- Gate status: Fail (soft gate blocked by 1 high finding)

## Summary

This is the first framework-driven audit run under the reusable security documentation and automation model. It reconciles historical findings from the 2025-11-21 audit set and adds current-cycle delta checks.

Current cycle highlights:

- Findings total: 5 (High: 1, Medium: 3, Low: 1)
- Blocking findings: 1 (`AUTO-AUTHZ-ROLE-001`)
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
