# ADR-0010 — `EmailSender` adapter selected by `EMAIL_PROVIDER` env, not `NODE_ENV`

- **Status:** Accepted
- **Date:** 2026-04-24
- **Origin:** `ADR-003` in the Password reset kit — [`features/password-reset`](../../internal/initiatives/features/password-reset/decisions.md)

---

## Context

The default mapping is `console` for dev/test, `resend` for staging/production — but staging contract tests and one-off "send a real email from local" workflows need to override.

## Decision

Introduce `EMAIL_PROVIDER` enum (`console | resend`). Default by `NODE_ENV` but allow explicit override. Boot-time guard in `feature.ts` throws if `EMAIL_PROVIDER=resend` and `RESEND_API_KEY` missing.

## Options considered

- Hard-code adapter selection by `NODE_ENV` (rejected — too rigid; can't test Resend integration locally).
- Inject adapter via test bootstrap only (rejected — staging/prod still need a runtime switch for incident workarounds).

## Consequences

Two env vars must stay in sync (`EMAIL_PROVIDER` + `RESEND_API_KEY`). Mitigated by the fail-fast boot guard.
