# Security Release Delta SOP

**Status:** Active
**Last updated:** 2026-04-13

Run this SOP before production release or high-risk hotfix deployment.

## Mandatory Commands

```bash
npm run test:unit:security-framework
npm run security:delta:gate
```

## Pass/Block Rule

- Pass: gate result has no unresolved high/critical blockers.
- Block: any unresolved high/critical finding.

## Required Documentation Updates

Update the active audit run:

- `audit-checklist.md`
- `findings-log.md`
- `remediation-plan.md`
- `metrics-tracker.md`
- `portfolio-summary.md` (sanitized)

If no active run exists, initialize one with `security:audit:init`.

## PR/Branch Expectations

- Security checklist in PR template is completed.
- Required CI checks are green (`checks`, `security_delta`, `tests`).
- Any accepted exception includes rationale, owner, and expiry.
