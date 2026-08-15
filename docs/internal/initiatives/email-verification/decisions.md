# Email Verification Kit — Decisions Log

ADR-style entries scoped to the email-verification kit. Cross-kit decisions live in `docs/internal/audits/saas-readiness/decisions.md`.

---

## ADR-001 — 24-hour TTL + anti-enumeration response shape (Proposed 2026-05-02)

**Context:** The password-reset kit uses a 15-minute TTL because users typically click the reset link immediately after triggering the flow. Email verification has a different user pattern: the email arrives during signup, but users may close the tab and finish later. A 15-minute TTL would force most users into the resend loop.

Anti-enumeration matters here because a public `/verify-email` endpoint could leak whether a token-hash exists if the response shape varies between "token unknown" / "token expired" / "token already used".

**Decision (proposed):**

1. **TTL: 24 hours.** Long enough for "verify after work", short enough to limit a stolen-link blast radius.
2. **Generic 400 for all `/verify-email` failure modes.** Identical body for token-not-found, token-expired, token-already-used. The body is `{ status: "error", message: "Verification link is invalid or has expired.", data: null, success: false }`.
3. **Always-200 on `/resend-verification`.** When the JWT subject is already verified, when the JWT subject is unverified (token issued + email sent), and when the JWT subject doesn't exist (impossible if the JWT is valid, but defensively returns 200). Body: `{ status: "success", message: "If your email is unverified, we sent a fresh verification link.", data: null, success: true }`.

**Status:** Proposed.

**Options considered:**

- _15-minute TTL._ Rejected: forces too many resends for the typical signup pattern.
- _72-hour TTL._ Rejected: stolen-link blast radius too long; abandoned signups accumulate active tokens.
- _Distinct error messages for invalid vs. expired vs. used._ Rejected: enables verification-link enumeration. Aligns with the same anti-enumeration rule in the password-reset kit.

**Consequences:**

- Users who don't verify within 24 hours must hit `/resend-verification` (which requires they be logged in, which they can do because registration also issues a JWT). Future kit may relax this if forks complain.
- The integration test must explicitly verify all three failure modes return identical bodies + 400.

**Links:**

- `audit-2026-05-01.md` § [P1-1.2] in `docs/internal/audits/saas-readiness/`
- `docs/internal/initiatives/features/password-reset/decisions.md` (anti-enumeration precedent).

---

## ADR-002 — Verification middleware is created but NOT applied to existing routes (Proposed 2026-05-02)

**Context:** `requireVerifiedEmail` is a tool. The audit identified that the base lacks email verification, but it did NOT prescribe that any current Lakira route should require it. Different forks will gate different endpoints (some will gate everything, some only payment endpoints).

**Decision (proposed):** Ship `requireVerifiedEmail` as a documented middleware but do not apply it to any existing route in this PR. The auth feature README and this kit's README both call it out as opt-in. Forkers wire it to whichever endpoints their product requires.

**Status:** Proposed. Likely to remain stable — applying it later is one-line per route.

**Options considered:**

- _Apply to all `/metric*` routes immediately._ Rejected: changes Lakira's runtime behavior; breaks any unverified test fixtures; out of scope for "scaffolding the base".
- _Don't ship the middleware at all._ Rejected: forkers would all reimplement the same check.

**Consequences:**

- Audit will mark [P1-1.2] as ✅ once the middleware exists and the verification flow is in place, even though no Lakira route uses the middleware.
- A unit test exercises the middleware against a fake `req.user`. No integration test wires it to a real route in this PR.

**Links:**

- `audit-2026-05-01.md` § [P1-1.2]
- `src/features/shared/auth/infrastructure/http/requireAdmin.ts` (sibling middleware to mirror).
