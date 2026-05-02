# SaaS Base Checklist

**Audit date:** 2026-05-01
**Full audit:** [`documents/development/architecture/saas-readiness/audit-2026-05-01.md`](documents/development/architecture/saas-readiness/audit-2026-05-01.md)
**Kit overview:** [`documents/development/architecture/saas-readiness/README.md`](documents/development/architecture/saas-readiness/README.md)

## Verdict

> **Not fork-ready as a SaaS base today.** Empirical static and test gates are all green, the DDD feature-slice architecture is consistently applied for the auth + core CRUD slices, and the security/observability primitives (helmet, hpp, xss-clean, three-tier rate limiter, Winston JSON logging, central error handler, OpenAPI gen + Swagger UI, security-delta CI gate) are all wired. But the repo is missing the public-base scaffolding a forker needs on day one — no `README.md`, no `LICENSE` despite `package.json` declaring ISC, no `.env.example` covering the full env surface, no refresh-token flow, no email verification, no multi-tenancy primitives, no request-ID propagation, no `trust proxy` setting (which silently breaks IP-based rate limiting on Render), and a roughly 13-file Lakira-branding footprint with no rename script. There is also moderate architectural drift inside the metric\* feature slices which a forker would inherit.

## Fork-ready exit criteria

A repo is fork-ready only when **all four** hold (see ADR-001 in [`decisions.md`](documents/development/architecture/saas-readiness/decisions.md)):

| #   | Criterion                                                                                                                       | Status today                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1   | Zero P0 gaps remaining                                                                                                          | ❌ — 7 P0 open                   |
| 2   | All six empirical commands green (`typecheck`, `lint`, `format:check`, `test`, `security:delta:check`, `docs:openapi:generate`) | ✅                               |
| 3   | Categories 1 (Auth), 4 (Security), 6 (DX), 7 (Testing), 8 (CI/CD), 11 (Forkability) at ≥80% ✅                                  | ❌ — only Cat 7 (Testing) at 83% |
| 4   | `LICENSE` and `.env.example` present at repo root                                                                               | ❌ — both missing                |

Three of four conditions fail. The audit is empirically green; the gap is structural and documentation.

## Scorecard

| Category                                | ✅     | ⚠️     | ❌     | N/A   |
| --------------------------------------- | ------ | ------ | ------ | ----- |
| 1. Authentication & Authorization       | 2      | 1      | 3      | 0     |
| 2. API Design & Contracts               | 4      | 2      | 0      | 0     |
| 3. Database Layer                       | 2      | 2      | 1      | 0     |
| 4. Security                             | 3      | 4      | 1      | 0     |
| 5. Error Handling & Observability       | 2      | 1      | 3      | 0     |
| 6. Developer Experience & Onboarding    | 4      | 0      | 2      | 0     |
| 7. Testing                              | 5      | 0      | 1      | 0     |
| 8. CI/CD & Deployment                   | 4      | 2      | 0      | 0     |
| 9. Multi-Tenancy & SaaS-Specific        | 0      | 1      | 4      | 0     |
| 10. Code Architecture & Maintainability | 0      | 5      | 0      | 0     |
| 11. Forkability                         | 0      | 3      | 3      | 0     |
| **Total (65 items)**                    | **26** | **21** | **18** | **0** |

**Severity counts:** P0 = 7, P1 = 17, P2 = 11.

## Empirical commands (2026-05-01)

| Command                         | Result                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run typecheck`             | ✅ exit 0                                                                                          |
| `npm run lint`                  | ✅ exit 0                                                                                          |
| `npm run format:check`          | ✅ exit 0                                                                                          |
| `npm test`                      | ✅ exit 0 (16 of 17 suites pass; 1 suite + 3 tests skipped — Redis-required suite skipped locally) |
| `npm run security:delta:check`  | ✅ exit 0 (4 medium dep findings; 0 high/critical)                                                 |
| `npm run docs:openapi:generate` | ✅ exit 0                                                                                          |

## Top 5 P0/P1 gaps

1. **P0 · Forkability** — `LICENSE` file missing despite `package.json` declaring `"license": "ISC"`. → [audit § 11.1](documents/development/architecture/saas-readiness/audit-2026-05-01.md#p0--11-forkability--license-file-missing)
2. **P0 · DX** — Root-level `README.md` missing. → [audit § 6.2](documents/development/architecture/saas-readiness/audit-2026-05-01.md#p0--6-developer-experience--rootlevel-readmemd-missing)
3. **P0 · DX** — `.env.example` missing or incomplete (only `.env.test.example` exists; missing all email/rate-limit/visualization env vars). → [audit § 6.1](documents/development/architecture/saas-readiness/audit-2026-05-01.md#p0--6-developer-experience--envexample-missing-or-incomplete)
4. **P0 · Security** — No `app.set("trust proxy", ...)` and no HTTPS-redirect, silently breaking IP-based rate limiting on Render-class PaaS. → [audit § 4.1](documents/development/architecture/saas-readiness/audit-2026-05-01.md#p0--4-security--no-trust-proxy--https-readiness)
5. **P0 · Auth** — No refresh-token flow; JWTs are 7-day non-rotating bearers and `/auth/logout` does not revoke. → [audit § 1.1](documents/development/architecture/saas-readiness/audit-2026-05-01.md#p0--1-authentication--no-refreshtoken-flow)

The remaining two P0s — [no multi-tenancy primitives § 3.1 / § 9.1](documents/development/architecture/saas-readiness/audit-2026-05-01.md#p0--3-database--no-multi-tenancy-primitives) and [no request-ID propagation § 5.1](documents/development/architecture/saas-readiness/audit-2026-05-01.md#p0--5-observability--no-requestid--correlationid-propagation) — are individually large but together complete the P0 inventory.

## What's already strong (✅ highlights)

- Auth slice is the canonical DDD reference: full layout, port-per-concern, manual DI through `buildAuthFeature()`.
- Three-tier rate limiting (global / user / analytics) + double-rate-limited password reset, with Redis store and in-memory fallback.
- Comprehensive Zod validation + centralized error messages + OpenAPI generation + Swagger UI + drift-check in CI.
- Test stack: unit + integration with per-worker DB port isolation, full table truncation between tests, coverage thresholds enforced.
- CI: lint + typecheck + tests + security-delta + contract tests on every PR, branch promotion `feature/* → dev → staging → main` enforced.
- Hexagonal compliance for email (port + 2 adapters), queue (port + 3 adapters), and cache (per-feature ports + Redis adapters).

## Re-running this audit

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run security:delta:check && npm run docs:openapi:generate
```

Then write the result to a new file `documents/development/architecture/saas-readiness/audit-YYYY-MM-DD.md`. Do not overwrite this audit; diff scorecards across runs to track progress. See the kit [`README.md`](documents/development/architecture/saas-readiness/README.md) for the full re-audit recipe.
