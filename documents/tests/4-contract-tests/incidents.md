# Contract Test Incidents – Lakira Backend

## 2026-01-14 – Schemathesis Baseline Run Reveals 112 Failures

- **Context:** First execution of `npm run test:contract:schemathesis:local` (reports under `schemathesis/reports/local/2026-01-14T08-19-10-426Z/`) using `.env.test` data via a dev-mode server on port 8002.
- **Impact:** 31/31 operations fuzzed but zero passed due to:
  - Response-envelope drift vs. OpenAPI schemas (missing `data.*` wrappers, omitted required fields).
  - Global rate limiter returning 429 for bulk fuzzing (should allow contract client or expose 429 in spec).
  - TRACE requests returning 404 instead of the documented 405 for unsupported methods.
  - Several endpoints returning 500 when receiving intentionally malformed payloads instead of defensive 4xx errors.
- **Next Actions:**
  1. ✅ (2026-01-14) Added `DISABLE_RATE_LIMITING` env toggle + docs so contract/Schemathesis runs bypass throttling noise.
  2. Align OpenAPI schemas with the actual success envelopes (or update the implementation to match the documented response shape).
  3. Implement blanket 405 handling (or update the spec) for unsupported HTTP verbs so TRACE/OPTIONS behaviour is deterministic.
  4. Harden analytics + metric controllers to return validation errors rather than unhandled 500s when fuzzed payloads are invalid.
