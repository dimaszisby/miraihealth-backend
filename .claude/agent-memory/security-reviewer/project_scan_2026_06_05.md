---
name: project-scan-2026-06-05
description: Fresh threat-surface scan results from 2026-06-05; new gaps not in prior audits
metadata:
  type: project
---

New gaps found in the 2026-06-05 scan (all NOT in prior audits):

1. **env singleton export** — `envManager.ts:114` exports `env` as a frozen module-level singleton AND `loadEnvOrExit()`. Files that `import { env }` directly (21 files) snapshot values at first import, breaking `withTestEnv` overrides. Not a production security risk but a test-isolation risk documented in user memory.

2. **RabbitMQ default credentials** — `zodEnv.ts:215-216` defaults `RABBITMQ_USER="guest"` and `RABBITMQ_PASSWORD="guest"`. RABBITMQ_PASSWORD does NOT match the `/(password|secret|token|key|certificate|url)$/i` suffix pattern so it IS redacted (it contains "password"), but the default itself is a well-known credential that can be used if the queue is accidentally exposed.

3. **DISABLE_RATE_LIMITING has no NODE_ENV=production guard** — `zodEnv.ts:188-191` accepts the flag in any environment. A misconfigured production deploy with this env var set bypasses all rate limiting silently.

4. **`sortBy: z.string().optional()`** — `metric-log/schema.zod.ts:87` accepts an arbitrary string for `sortBy` in the legacy `listMetricLogsQuery`. This schema is exported (`getAllMetricLogsSchema`) but the router does NOT wire it to any endpoint — the router uses the cursor-based schema instead. Dead code risk, not active injection risk.

5. **`aggregatedStatsQuery` has no date range cap** — `metric-log/schema.zod.ts:145-149` accepts `startDate`/`endDate` as arbitrary ISO datetimes with no maximum span. The stats repo does a full `findAll` across that range without pagination or a row count guard.

6. **`SENTRY_DSN` and `RESEND_API_KEY` not redacted in logs** — `sensitive-keys.ts` pattern `/(password|secret|token|key|certificate|url)$/i` does not match `SENTRY_DSN` (ends in `DSN`) or `RESEND_API_KEY` (ends in `KEY` — wait, KEY is matched). Re-check: `SENTRY_DSN` is NOT matched; `RESEND_API_KEY` ends in `KEY` which IS matched. So only SENTRY_DSN is the gap.

**Why:** Recorded to avoid redundant re-discovery in future sessions.

**How to apply:** Reference these as "known new gaps from 2026-06-05 scan" when tracking remediation.
