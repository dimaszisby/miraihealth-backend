# Password Reset — Decisions

## ADR-001 — Store SHA-256 hash of reset token, never raw (Accepted 2026-04-24)

**Context:** Reset tokens give full account access for 15 min. A DB read by an attacker (backup leak, SQL injection elsewhere, log scrape) must not yield usable tokens.

**Decision:** Generate raw token via `crypto.randomBytes(32).toString("base64url")`. Persist only `sha256(raw)` hex in `password_reset_tokens.token_hash`. Lookup hashes the incoming token before querying.

**Options considered:**

- Store raw token (rejected — DB compromise = account takeover window).
- Encrypt token with KMS (rejected — adds infra dep; sha256 is one-way and sufficient for short-lived single-use).
- bcrypt the token (rejected — slow on read path; sha256 is appropriate for high-entropy random tokens).

**Consequences:** Must hash on every lookup. Token cannot be re-derived from DB (intended).

---

## ADR-002 — Identical 200 response for known and unknown emails (Accepted 2026-04-24)

**Context:** `/forgot-password` is a classic enumeration vector — a 404 vs 200 leaks which emails have accounts.

**Decision:** Always return 200 with a generic `"If an account exists for that email, we've sent reset instructions."` Email send (and DB write) only occur when the email is found. Send happens after the response shape is decided so failures don't change response shape or timing meaningfully.

**Options considered:**

- 404 on unknown email (rejected — leaks account existence).
- Synthetic delay on unknown email path to mask timing (rejected — adds complexity; the always-200 contract is strong enough; logs reveal which path ran for legitimate ops debugging).

**Consequences:** Slightly harder to debug from API alone; logs (`[EMAIL:CONSOLE]` lines or Resend dashboard) are the source of truth.

---

## ADR-003 — `EmailSender` adapter selected by `EMAIL_PROVIDER` env, not `NODE_ENV` (Accepted 2026-04-24)

**Context:** The default mapping is `console` for dev/test, `resend` for staging/production — but staging contract tests and one-off "send a real email from local" workflows need to override.

**Decision:** Introduce `EMAIL_PROVIDER` enum (`console | resend`). Default by `NODE_ENV` but allow explicit override. Boot-time guard in `feature.ts` throws if `EMAIL_PROVIDER=resend` and `RESEND_API_KEY` missing.

**Options considered:**

- Hard-code adapter selection by `NODE_ENV` (rejected — too rigid; can't test Resend integration locally).
- Inject adapter via test bootstrap only (rejected — staging/prod still need a runtime switch for incident workarounds).

**Consequences:** Two env vars must stay in sync (`EMAIL_PROVIDER` + `RESEND_API_KEY`). Mitigated by the fail-fast boot guard.
