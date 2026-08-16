# ADR-0018 — Verification middleware is created but NOT applied to existing routes

- **Status:** Proposed
- **Date:** 2026-05-02
- **Origin:** `ADR-002` in the Email verification kit — [`email-verification`](../../internal/initiatives/email-verification/decisions.md)

---

## Context

`requireVerifiedEmail` is a tool. The audit identified that the base lacks email verification, but it did NOT prescribe that any current Lakira route should require it. Different forks will gate different endpoints (some will gate everything, some only payment endpoints).

## Decision

Ship `requireVerifiedEmail` as a documented middleware but do not apply it to any existing route in this PR. The auth feature README and this kit's README both call it out as opt-in. Forkers wire it to whichever endpoints their product requires.

## Options considered

- _Apply to all `/metric*` routes immediately._ Rejected: changes Lakira's runtime behavior; breaks any unverified test fixtures; out of scope for "scaffolding the base".
- _Don't ship the middleware at all._ Rejected: forkers would all reimplement the same check.

## Consequences

- Audit will mark [P1-1.2] as ✅ once the middleware exists and the verification flow is in place, even though no Lakira route uses the middleware.
- A unit test exercises the middleware against a fake `req.user`. No integration test wires it to a real route in this PR.

## Links

- `audit-2026-05-01.md` § [P1-1.2]
- `src/features/shared/auth/infrastructure/http/requireAdmin.ts` (sibling middleware to mirror).
