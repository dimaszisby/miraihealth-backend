# SaaS Base Readiness

## Overview

This kit holds the SaaS-base readiness audit for the Lakira backend — a graded, file-path-precise assessment of how close the repo is to being **forkable as a generic SaaS base** rather than a personal-app codebase.

The audit grades against the project's own intended standard (`.claude/rules/*`, `documents/tests/TESTING_STRATEGY.md`, `documents/ci-cd/CI_CD_STRATEGY.md`) and not just generic SaaS criteria. Empirical verification commands are run; a category cannot be ✅ if its verification fails or if the intended standard itself is missing.

## Scope

- **In scope:** structural readiness (auth, security, observability, multi-tenancy, DX, CI/CD, forkability) + architectural drift detection across feature slices.
- **Out of scope:** UX of any consumer surface, the frontend codebase, performance/load testing, deep dependency CVE triage (the `security:delta:check` gate already covers that).

## Files in this kit

- `README.md` — this file.
- `audit-2026-05-01.md` — full audit run on 2026-05-01. Contains the scorecard, gap entries (P0/P1/P2), evidence, and recommended fixes.
- `iteration-plan.md` — master roadmap mapping each remediation phase to its own architecture-folder kit. Read this to know which kit to open when picking up a phase.
- `decisions.md` — ADR entries for any standards adopted in response to the audit. New decisions append here; do not rewrite history.

The repo-root `SAAS-BASE-CHECKLIST.md` is the public, consumer-facing one-pager: verdict + scorecard + top 5 gaps. It links here for detail.

## Iteration plan

Doc kits for each P0/P1 remediation phase live as siblings under `documents/development/architecture/<topic>/`. The full per-phase mapping (which kit closes which audit gaps, gating ADRs, recommended execution order) is in [`iteration-plan.md`](./iteration-plan.md). The `saas-readiness/` folder stays as the **tracker**; the actual remediation work lives in the per-topic kits.

## Re-running the audit

Run all six commands and capture exit codes:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run security:delta:check
npm run docs:openapi:generate
```

A category cannot be ✅ if any of those fail. See `audit-2026-05-01.md` Appendix B for the full re-audit recipe (branding scan, env-bypass scan, sequelize-leak scan, soft-delete consistency scan).

When re-auditing, write the result to a new dated file (`audit-YYYY-MM-DD.md`) in this folder — do not overwrite the prior one. Diff the scorecards across runs to track progress.

## How to read the gap entries

Each non-✅ item in `audit-2026-05-01.md` follows the same structure:

- **Status** — ⚠️ (partial) or ❌ (missing).
- **What's missing/incomplete** — 1–3 sentences, no soft pedalling.
- **Why it matters for a SaaS base** — the reason it's worth fixing for a forker.
- **Recommended fix** — opinionated, picks specific lib/pattern fitting the existing stack.
- **Effort** — S (≤ ½ day) / M (1–3 days) / L (>3 days).
- **Evidence** — exact file paths or "no file found".

## Severity tags

- **P0** — blocks "fork-ready" status. Security holes, missing license, no `.env.example`, no README.
- **P1** — should be fixed before recommending the base externally. Missing email verification, no Sentry hook, soft-delete drift, etc.
- **P2** — nice-to-have. OAuth, feature flags, outbound webhooks, APM, etc.

## Fork-ready exit criteria

The repo is fork-ready only when **all four** conditions hold:

1. Zero P0 gaps remaining.
2. All six empirical commands green.
3. Categories 1 (Auth), 4 (Security), 6 (DX), 7 (Testing), 8 (CI/CD), 11 (Forkability) at ≥80% ✅.
4. `LICENSE` and `.env.example` present.

Today (2026-05-01): condition 1 fails (7 P0s), condition 3 fails (5 of 6 categories below 80%), condition 4 fails (both files missing). Condition 2 holds.

## References

- `documents/todos/2026-05-01-promt-saas-readiness-audit.md` — the audit prompt.
- `.claude/rules/` — the intended standard.
- `documents/tests/TESTING_STRATEGY.md`
- `documents/ci-cd/CI_CD_STRATEGY.md`
- `documents/security/` — existing security-audit infrastructure (do not reformat).
- `documents/openapi/lakira-backend-openapi.json` — generated API contract.
