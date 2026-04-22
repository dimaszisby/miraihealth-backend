# Security Audit Framework

**Status:** Active
**Last updated:** 2026-04-13

## Purpose

Define the standard lifecycle and artifact expectations for Lakira backend security audits.

## Lifecycle

1. Prepare scope, baseline, and run folder.
2. Assess via automated checks + targeted manual review.
3. Validate findings with reproducible evidence.
4. Report findings/control status.
5. Remediate with owners and due dates.
6. Verify closures and re-run checks.
7. Close run and update audit index.

## Required Run Artifacts

Each `documents/security/audit/audit-YYYY-MM-DD/` run must include:

- `README.md`
- `audit-plan.md`
- `audit-checklist.md`
- `threat-model.md`
- `control-matrix.md`
- `findings-log.md`
- `remediation-plan.md`
- `decisions.md`
- `incidents.md`
- `metrics-tracker.md`
- `portfolio-summary.md`

## Mapping Rule

Each finding must map to:

- at least one internal control ID
- at least one ASVS / Top 10 / SSDF reference

## Completion Rule

A run is complete only when:

- required artifacts exist and are coherent
- unresolved high/critical findings are either closed or formally exception-approved
- gate evidence is recorded
