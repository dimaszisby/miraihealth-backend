# Security Scripts Usage Guide

**Status:** Active
**Last updated:** 2026-04-13

Run commands from repo root.

## Key Commands

- Initialize run kit:
  - `npm run security:audit:init -- --date YYYY-MM-DD`
- Produce delta report:
  - `npm run security:delta:check`
- Evaluate gate from report:
  - `npm run security:gate:evaluate`
- Combined shortcut:
  - `npm run security:delta:gate`
- Validate framework assets:
  - `npm run test:unit:security-framework`

## Expected Artifacts

- `tmp/security/security-delta-report.json`
- `tmp/security/security-gate-result.json`
- `tmp/security/npm-audit-production.json`

## Minimal Operator Workflow

1. Initialize or pick active audit run folder.
2. Run `npm run security:delta:gate`.
3. If blocked, remediate or document formal exception.
4. Update run docs (`findings`, `remediation`, `metrics`, `decisions`).

## Troubleshooting

- Invalid date: use `YYYY-MM-DD`.
- Gate blocked: inspect unresolved high/critical findings in gate output.
- Missing output: confirm command was run from repo root and script completed.
