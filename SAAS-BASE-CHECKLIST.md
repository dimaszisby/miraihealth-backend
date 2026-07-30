# SaaS Base Checklist

**Audit date:** 2026-05-24 (independent gone-gold review)
**Full audit:** [`documents/development/architecture/saas-readiness/audit-2026-05-24-independent.md`](documents/development/architecture/saas-readiness/audit-2026-05-24-independent.md)
**Closeout summary:** [`documents/development/architecture/saas-readiness/FINAL-AUDIT-SUMMARY.md`](documents/development/architecture/saas-readiness/FINAL-AUDIT-SUMMARY.md)
**Kit overview:** [`documents/development/architecture/saas-readiness/README.md`](documents/development/architecture/saas-readiness/README.md)
**Verdict authority:** ADR-008 in [`decisions.md`](documents/development/architecture/saas-readiness/decisions.md)

## Verdict

> **✅ GOLD WITH CAVEATS — publishable as a forkable SaaS base today.** An independent,
> skeptical re-audit re-ran all six empirical gates (green), verified the security and
> multi-tenancy fundamentals by reading code (not trusting the prior self-audit), and ran a
> live forkability dry-run. The strict ADR-001 fork-ready gate now **passes**: zero P0,
> the six critical categories all ≥80% (Cat 4 at 87.5% after P1-4.2 + P2-4.5 closed), and
> `LICENSE` + `.env.example` present. Multi-tenant row isolation is enforced at the
> repository layer, refresh-token rotation is single-use with family revocation on reuse,
> email/reset tokens are 256-bit + hashed + single-use, the Dockerfile and `deploy_production`
> gate are production-grade, and the forked tree builds + typechecks + unit-tests clean. What
> keeps it short of a clean GOLD is a cluster of six ≤1-day quality gaps (C1–C6 below) — most
> notably that the bootstrap-fork flow doesn't work as printed and the error envelope is
> inconsistent + undocumented in the OpenAPI contract. No exploitable P0 remains.

## Fork-ready exit criteria

A repo is fork-ready only when **all four** hold (see ADR-001 in [`decisions.md`](documents/development/architecture/saas-readiness/decisions.md)):

| #   | Criterion                                                                                                                       | Status (2026-05-24)                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Zero P0 gaps remaining                                                                                                          | ✅ — all 7 closed                         |
| 2   | All six empirical commands green (`typecheck`, `lint`, `format:check`, `test`, `security:delta:check`, `docs:openapi:generate`) | ✅                                        |
| 3   | Categories 1 (Auth), 4 (Security), 6 (DX), 7 (Testing), 8 (CI/CD), 11 (Forkability) at ≥80% ✅                                  | ✅ — Cat 4 = 87.5%; all six clear the bar |
| 4   | `LICENSE` and `.env.example` present at repo root                                                                               | ✅ — both present                         |

**All four pass.** The repo is fork-ready by the strict ADR-001 reading; the open caveats are
industry-standard quality items the gate does not measure (see below).

## Scorecard (independent re-grade)

| Category                                | ✅     | ⚠️     | ❌    | N/A   |
| --------------------------------------- | ------ | ------ | ----- | ----- |
| 1. Authentication & Authorization       | 5      | 0      | 1     | 0     |
| 2. API Design & Contracts               | 3      | 3      | 0     | 0     |
| 3. Database Layer                       | 3      | 2      | 0     | 0     |
| 4. Security                             | 6      | 2      | 0     | 0     |
| 5. Error Handling & Observability       | 4      | 1      | 1     | 0     |
| 6. Developer Experience & Onboarding    | 5      | 1      | 0     | 0     |
| 7. Testing                              | 6      | 0      | 0     | 0     |
| 8. CI/CD & Deployment                   | 6      | 0      | 0     | 0     |
| 9. Multi-Tenancy & SaaS-Specific        | 2      | 1      | 2     | 0     |
| 10. Code Architecture & Maintainability | 3      | 2      | 0     | 0     |
| 11. Forkability                         | 4      | 2      | 0     | 0     |
| **Total (65 items)**                    | **47** | **14** | **4** | **0** |

**Severity counts (open):** P0 = **0**. Remaining work is the C1–C6 caveats (3 graded P1:
C1/C3/C4; 3 graded P2: C2/C5/C6) plus the by-design deferrals (subscription/billing P1-9.2,
OAuth, APM, feature flags, outbound webhooks). The independent grade is intentionally stricter
than the 2026-05-20 self-audit (52 / 9 / 4) — see ADR-008.

## Empirical commands (2026-05-24, re-run)

| Command                         | Result                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run typecheck`             | ✅ exit 0                                                                                    |
| `npm run lint`                  | ✅ exit 0                                                                                    |
| `npm run format:check`          | ✅ exit 0                                                                                    |
| `npm test`                      | ✅ unit exit 0 (84 suites / 497 tests); integration exit 0 (24 pass + 2 Redis-flagged skips) |
| `npm run security:delta:check`  | ✅ exit 0 (8 medium dep findings; 0 high/critical)                                           |
| `npm run docs:openapi:generate` | ✅ exit 0 (regenerated spec byte-identical to committed — in sync)                           |

> Verified on host Node 22; CI/Docker use the mandated Node 20 — re-confirm parity there.
> Run `npm test` as the project defines it (`test:unit` then `test:integration`); a combined
> invocation under `SKIP_DB_LIFECYCLE=true` produces false failures.

## Open caveats — path to clean GOLD (each ≤1 day)

1. **C1 · Forkability (P1)** — `bootstrap-fork.sh` rotates `JWT_SECRET` / sets `APP_NAME` only in `.env.development` (gitignored, absent on a fresh clone → no-op); its printed `npm test` step fails out-of-box without an undocumented `.env.test`.
2. **C3 · API Contracts (P1)** — global error handler emits three shapes (incl. an undocumented `"fail"` status), bypassing `errorResponse()` and violating `api-design.md`; OpenAPI documents no 4xx/5xx schema (only 429).
3. **C4 · Architecture (P1)** — the architecture test enforces only 3 narrow checks (no negative cases); real app→infra ORM writes, `AppError` in domain entities, and cross-feature deep imports pass green.
4. **C2 · Forkability (P2)** — `app-name.ts` defaults to `"lakira-backend"`; combined with C1 a fresh fork brands its runtime as "lakira-backend".
5. **C5 · Observability (P2)** — Sentry `init()` has no `beforeSend` PII scrubber.
6. **C6 · Security (P2)** — `SENSITIVE_KEY_PATTERN` is suffix-anchored; misses `authorization`/`cookie`/`bearer` (latent).

Full evidence (file:line) is in the [dated audit](documents/development/architecture/saas-readiness/audit-2026-05-24-independent.md); fix-status tracking is in [`FINAL-AUDIT-SUMMARY.md` § 4](documents/development/architecture/saas-readiness/FINAL-AUDIT-SUMMARY.md).

## What's already strong (✅ highlights)

- **Multi-tenancy:** `Organization` + `Membership`, `organizationId` on every domain table, repository-layer row isolation (verified in every domain read repo), cross-org isolation integration tests.
- **Auth:** refresh-token family with single-use rotation + reuse-revocation; email verification; password reset; org-scoped RBAC via membership roles; Redis-backed login lockout; `TokenProvider.verify()` port (no `jwt.verify` in middleware).
- **Observability:** request-ID propagation via AsyncLocalStorage + Winston correlation; Sentry 5xx hook; `/api/v1/ready` DB+Redis readiness probe.
- **Production:** multi-stage Dockerfile (non-root, `npm ci --omit=dev`, `dumb-init`); `deploy_production` gated on `main` + GitHub environment protection; e2e Jest project.
- **Forkability scaffolding:** `LICENSE`, root `README.md`, `CONTRIBUTING.md`, `.env.example`, `bootstrap-fork.sh` (validated `--name`), `APP_NAME` centralization, `FORKED-FROM.md`.
- **Quality gates:** Zod validation + centralized errors + OpenAPI gen + Swagger + drift check; three-tier rate limiting; 664 passing tests with coverage thresholds; security-delta CI gate; branch promotion `feature/* → dev → staging → main`.

## Re-running this audit

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run security:delta:check && npm run docs:openapi:generate
```

Then write the result to a new file `documents/development/architecture/saas-readiness/audit-YYYY-MM-DD.md` (do not overwrite a prior audit) and update this checklist to point at it. See the kit [`README.md`](documents/development/architecture/saas-readiness/README.md) for the full re-audit recipe. When caveats C1–C6 close, produce a fresh dated audit and re-state the verdict as **GOLD** per ADR-008.
