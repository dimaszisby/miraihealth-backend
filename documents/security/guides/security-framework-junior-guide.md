# Security Framework Quick Guide

**Status:** Active
**Last updated:** 2026-04-13

## What this framework gives you

- Repeatable audit workflow
- Standardized finding/control/evidence model
- CI gate behavior for unresolved high/critical risk

## Core Terms

- Audit run: `documents/security/audit/audit-YYYY-MM-DD/`
- Finding: issue + severity + owner + due date + evidence
- Control: required security expectation from master checklist
- Evidence: code refs, command outputs, artifacts proving state

## Minimum Run Artifacts

- `README.md`, `audit-plan.md`, `audit-checklist.md`, `threat-model.md`
- `control-matrix.md`, `findings-log.md`, `remediation-plan.md`
- `decisions.md`, `incidents.md`, `metrics-tracker.md`, `portfolio-summary.md`

## Standard Flow

1. Initialize run folder
2. Execute checks + review controls
3. Log findings with mapping/evidence
4. Assign remediation owners/dates
5. Re-run checks and verify closure
6. Update audit index

## Non-negotiables

- Every finding has evidence + owner + due date.
- No “fixed” status without verification evidence.
- Avoid sensitive details in portfolio-facing summaries.
