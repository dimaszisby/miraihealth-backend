# SaaS Readiness — Final Audit Summary (Gone-Gold Closeout)

**Status:** ✅ **GOLD WITH CAVEATS** — publishable as a forkable SaaS base today, with six
named ≤1-day follow-ups tracked below.
**As of:** 2026-05-24 · **Branch:** `feat/cors-multi-origin` @ `a4c4a86`
**Authoritative audit:** [`audit-2026-05-24-independent.md`](./audit-2026-05-24-independent.md)
(independent outside review). This file is the human-readable capstone that ties the whole
SaaS-readiness initiative together; the dated audit is the evidence of record.

> **What this document is.** A single-page closeout for the SaaS-base readiness initiative:
> where we started, what was fixed across the eight phases, the result of the final
> independent audit, the open caveats and their fix scope, and the lineage of audit runs.
> For per-gap evidence (file:line), read the dated audit files. For the binary gate, see
> ADR-001 in [`decisions.md`](./decisions.md). For the roadmap, see
> [`iteration-plan.md`](./iteration-plan.md).

---

## 1. Executive summary

The Lakira backend began as a personal-app codebase and was hardened into a forkable SaaS
base across eight planned phases. The original baseline audit (2026-05-01) found **7 P0,
17 P1, 11 P2** gaps. Phases 0–7 closed **all 7 P0s and 15 of 17 P1s**; two post-phase
follow-ups (P1-4.2 analytics env-reads, P2-4.5 multi-origin CORS) closed the last items
blocking the strict fork-ready gate. Phase 8 (subscription/billing) is deferred by design.

An independent, skeptical "gone-gold" review on 2026-05-24 re-ran all six empirical gates
(green), pressure-tested the security- and multi-tenancy-critical claims by reading code
(they hold up), ran the architectural drift sweep, and performed a **live forkability
dry-run**. Result: the repo **passes the strict ADR-001 fork-ready gate** and has no P0
blockers, but carries six industry-standard quality gaps that an outside reviewer would fix
before recommending it as a base. Verdict: **GOLD WITH CAVEATS.**

---

## 2. The final audit run (2026-05-24, independent)

### Empirical gates — all six green (re-run, real exit codes)

| Gate                            | Exit | Notes                                                                                                                 |
| ------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`             | `0`  | Clean                                                                                                                 |
| `npm run lint`                  | `0`  | Clean                                                                                                                 |
| `npm run format:check`          | `0`  | Prettier-clean                                                                                                        |
| `npm test`                      | `0`  | unit **84 suites / 497 tests**; integration **24 pass + 2 Redis-flagged skips (5 tests), 0 fail**; `migrate:test` `0` |
| `npm run security:delta:check`  | `0`  | **8 medium, 0 high/critical**                                                                                         |
| `npm run docs:openapi:generate` | `0`  | Regenerated spec byte-identical to committed (in sync)                                                                |

> ⚠️ **Re-audit integrity note:** run `npm test` exactly as the project defines it
> (`test:unit` then `test:integration`). A naïve combined `jest --selectProjects unit
integration` under `SKIP_DB_LIFECYCLE=true` _appears_ to fail (8 errors) — an artifact of
> running integration without its DB lifecycle, not a real failure. Also never let a shell
> pipeline ending in `tail`/`echo` mask jest's exit code. Gates were verified on host
> **Node 22**; CI/Docker use the mandated **Node 20** — re-confirm there.

### Strict ADR-001 fork-ready gate → **PASS**

| Criterion                            | Result                                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| ① Zero P0 gaps                       | ✅ (all 7 closed)                                                     |
| ② All six gates green                | ✅                                                                    |
| ③ Cat 1/4/6/7/8/11 ≥ 80% ✅          | ✅ — Cat 4 = **87.5%** after P1-4.2 + P2-4.5 closed; all others ≥ 80% |
| ④ `LICENSE` + `.env.example` present | ✅                                                                    |

> ADR-007 framed the pass as "closing P2-4.5 flips the gate." That is arithmetically
> incomplete: Cat 4 was 5✅/3⚠️ (62.5%); CORS alone → 6/8 = 75% (still < 80%). The gate only
> clears because **P1-4.2 also closed** (commit `302a335`). Both were required; both landed.

### What the audit verified solid (by reading code, not trusting prose)

- **Multi-tenant row isolation at the repository layer** — every domain read scopes by
  `organizationId` in the WHERE clause, not just middleware.
- **Refresh-token rotation** — single-use, row-locked in a transaction, with **family
  revocation on reuse** (draft-ietf-oauth-security-topics compliant).
- **Email / password-reset tokens** — 256-bit `randomBytes`, SHA-256-hashed at rest,
  single-use, time-boxed (24h / 15min).
- **JWT** — `jsonwebtoken@9.0.3` rejects `alg:none` by default; HS256 throughout.
- **Request-ID correlation** — AsyncLocalStorage propagates across awaits; injected into every
  log line.
- **Production runtime** — multi-stage Dockerfile (`npm ci --omit=dev`, non-root `USER node`,
  `dumb-init`); `deploy_production` gated on `main` + GitHub environment protection.
- **Migrations** — safe ordering (add-nullable → backfill → NOT NULL → index); no destructive
  step without a backfill path.

---

## 3. What was fixed (remediation journey, Phases 0–7)

**Baseline → now:** 7 P0 / 17 P1 / 11 P2 (2026-05-01) → **0 P0 / 2 P1-by-design-deferred /
P2 follow-ups** (2026-05-24).

| Phase                  | Closed                                 | Outcome                                                                                                                    |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 0 — Cheap-P0 sweep     | P0-4.1, P0-6.1, P0-6.2, P0-11.1        | `trust proxy` + HTTPS readiness, `.env.example`, root `README.md`, `LICENSE`                                               |
| 1 — JWT lifecycle      | P0-1.1, P1-10.3                        | Refresh-token family + rotation; `TokenProvider.verify()` port (no `jwt.verify` in middleware)                             |
| 2 — Observability      | P0-5.1, P1-5.2, P1-5.3, P1-4.3         | Request-ID ALS, Sentry hook (5xx), `/ready` probe, Winston redaction filter                                                |
| 3 — Email verification | P1-1.2                                 | End-to-end verify + resend, gated by `requireVerifiedEmail`                                                                |
| 4 — Multi-tenancy      | P0-3.1, P0-9.1, P1-1.3                 | `Organization` + `Membership` + `organizationId` on all domain tables; RBAC via org roles                                  |
| 5 — Drift cleanup      | P1-10.1, P1-10.2, P2-10.4, P2-10.5     | Canonical DDD layout + architecture test (see caveat **C4**)                                                               |
| 6 — Forkability        | P1-11.2, P1-11.3, P1-11.4, P2-11.5⚠️   | `CONTRIBUTING.md`, `bootstrap-fork.sh`, `APP_NAME` centralization (see caveats **C1/C2**); CachePort consolidation partial |
| 7 — Production runtime | P1-8.3, P1-8.4, P1-4.4, P1-7.1         | Multi-stage Dockerfile, `deploy_production`, login lockout, e2e Jest project                                               |
| post-7                 | P1-4.2 (`302a335`), P2-4.5 (`a4c4a86`) | Analytics env-reads routed through `envManager`; CORS comma-separated allowlist (ADR-007)                                  |
| 8 — Subscription       | P1-9.2                                 | 🅿️ Deferred by design (post-multi-tenancy)                                                                                 |

---

## 4. Open caveats (the "gone-gold" punch list)

Each is scoped to ≤1 day. None blocks the ADR-001 gate or represents an exploitable P0.
**Recommended order:** C1 and C3 first (a forker / API consumer hits these first), then the
fast hardening wins C2/C5/C6, then C4.

| ID     | Caveat                                                                                                                                                                                                                                                                                      | Sev | Scope | Status |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----- | ------ |
| **C1** | **Fork flow doesn't work as printed** — `bootstrap-fork.sh` rotates `JWT_SECRET` / sets `APP_NAME` only in `.env.development` (gitignored, absent on fresh clone → silent no-op); its printed step 4 `npm test` fails out-of-box (84 suites) without `.env.test`, which is never mentioned. | P1  | ≤1d   | ☐ Open |
| **C2** | **Lakira branding leaks into the forked runtime** — `src/config/app-name.ts:4` defaults to `"lakira-backend"`; because C1's `APP_NAME` write misses, a fresh fork brands logs/OpenAPI/queues/emails as "lakira-backend".                                                                    | P2  | ≤1h   | ☐ Open |
| **C3** | **Error envelope inconsistent + undocumented** — `error.ts` hand-rolls 3 shapes (incl. an undocumented `"fail"` status), bypassing `errorResponse()`, violating `api-design.md`; OpenAPI documents no 4xx/5xx schema (only 429).                                                            | P1  | ≤1d   | ☐ Open |
| **C4** | **Architecture test too weak** — enforces only 3 narrow checks, no negative cases; real app→infra ORM writes, `AppError` in domain entities, and cross-feature deep imports pass green.                                                                                                     | P1  | ≤1d   | ☐ Open |
| **C5** | **Sentry has no PII scrubbing** — `Sentry.init()` lacks a `beforeSend` to strip `authorization`/`cookie`/body secrets before egress.                                                                                                                                                        | P2  | ≤1h   | ☐ Open |
| **C6** | **Log-redaction suffix-anchored** — `SENSITIVE_KEY_PATTERN` misses `authorization`, `cookie`, `bearer`, `passwordHash` (latent: nothing logs them today).                                                                                                                                   | P2  | ≤1h   | ☐ Open |

> **Fix-status convention:** flip ☐ Open → ✅ Fixed (with commit SHA) as each lands. When all
> six are closed, the verdict can be re-stated as **GOLD** and a new dated audit run produced
> per ADR-002.

---

## 5. Possible issues — needs human judgment (not blockers)

These are conscious-design or low-risk items the audit surfaced for a human decision, not
defects to fix blindly:

- **Cross-org public-metric reference** — `originalMetricExists` is intentionally org-unscoped
  (documented) and returns only a boolean, for metric cloning. Confirm "public" content
  _should_ cross tenant boundaries for your product.
- **Login lockout fails open** when Redis is down (availability over security; ASVS V2.2.1).
- **TOCTOU on single-use tokens** — `VerifyEmail` (documented, idempotent → fine) and
  `ResetPassword` (undocumented) check-then-mark non-atomically; refresh tokens use a row lock.
- **JWT `verify()` doesn't pin `algorithms` / no `iss`/`aud`** (low risk; HS256 + `jsonwebtoken@9`).
- **Unauthenticated info disclosure** — `/health` returns `NODE_ENV`; `/ready` returns
  db/redis liveness (no versions leaked).
- **Express 4 (maintenance mode)** — source of several of the 8 medium advisories; Express 5 is GA.
- **`xss-clean@0.1.4` unmaintained** (tracked P2-4.6) — retire in favor of schema-layer escaping.
- **Migration lock at scale** — `changeColumn` NOT NULL + non-`CONCURRENTLY` index lock hot
  tables for a forker migrating a populated DB.

---

## 6. Audit lineage

| Date       | File                                                                   | Verdict                                         | Scorecard                                           |
| ---------- | ---------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| 2026-05-01 | [`audit-2026-05-01.md`](./audit-2026-05-01.md)                         | NOT fork-ready                                  | 26✅ / 21⚠️ / 18❌ — 7 P0, 17 P1, 11 P2             |
| 2026-05-20 | [`audit-2026-05-20.md`](./audit-2026-05-20.md)                         | Shippable; not strictly fork-ready (self-audit) | 52✅ / 9⚠️ / 4❌ — 0 P0, 4 P1, 9 P2                 |
| 2026-05-24 | [`audit-2026-05-24-independent.md`](./audit-2026-05-24-independent.md) | **GOLD WITH CAVEATS** (independent)             | ADR-001 gate **PASS**; 6 caveats + 8 judgment items |

**Key disagreements the independent run raised with the 05-20 self-audit** (full evidence in
the dated file): security findings 1→8 medium; `svix` present transitively via `resend`;
`token-generator.ts` is a second `jwt.sign` path; the "no Sequelize leak in application" and
"drift closed / arch-test enforces" claims are overstated; the runtime branding "flips in one
shot" claim is false on a fresh fork; and the error-envelope ⚠️ is stronger than graded.

---

## 7. Recommended next actions

1. **Close C1 + C3** — the two a forker / API consumer hits first.
2. **Land C2, C5, C6** — fast (~1h each) hardening wins.
3. **Strengthen the architecture test (C4)** and fix the ~5 leaking files so drift can't
   silently return.
4. **Re-run all six gates on Node 20** to confirm parity with CI/Docker.
5. When C1–C6 are closed, produce a new dated `audit-YYYY-MM-DD.md` per ADR-002, re-state the
   verdict as **GOLD**, and update the root `SAAS-BASE-CHECKLIST.md` to point at it.
6. Phase 8 (subscription/billing) remains the only deferred initiative — open its kit when
   billing is up next.

---

## 8. Related documents

- [`audit-2026-05-24-independent.md`](./audit-2026-05-24-independent.md) — authoritative final audit (evidence of record)
- [`audit-2026-05-20.md`](./audit-2026-05-20.md) · [`audit-2026-05-01.md`](./audit-2026-05-01.md) — prior runs
- [`decisions.md`](./decisions.md) — ADR-001 (fork-ready gate) … ADR-007 (CORS allowlist)
- [`iteration-plan.md`](./iteration-plan.md) — eight-phase roadmap
- [`README.md`](./README.md) — kit overview + re-audit recipe
- `SAAS-BASE-CHECKLIST.md` (repo root) — public one-pager (update to point here per ADR-002)
- Per-phase kits: `../{jwt,observability,email-verification,multi-tenancy,feature-vertical-slice-migration,forkability,production-readiness}/`
