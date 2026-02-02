# 2026-01-27 - Contract local run (20:15) remediation plan

Incident log: `documents/incidents/2026-01-27-contract-local-log-2015PM.md`

## Summary

- Newman suites pass; Schemathesis is down to 5 failures plus 3 warnings.
- Remaining failures center on auth register schema drift, analytics query validation/regex, and a 500 on metric update.
- Warnings point to missing auth for `POST /auth/login`, missing seeded IDs for delete/update flows, and schema mismatches for metric logs/settings.

## Plan

### 1. Align auth register schema with behavior (high)

- Confirm whether `isPublicProfile` is accepted as input; if yes, add it to the request schema and OpenAPI.
- Decide if `passwordConfirmation` is required; enforce validation or relax the schema to match behavior.
- Document any conflict responses (409) if still returned under duplicates.

### 2. Tighten analytics query validation + schema (high)

- Make analytics query validators strict to reject unknown query keys.
- Update `last` regex to ASCII digits in validators and OpenAPI (`^[0-9]+(h|d|w|m|y)$`).
- Regenerate OpenAPI and re-run Schemathesis to confirm the two analytics failures are gone.

### 3. Fix metric update 500s (high)

- Reproduce the 500 on `PUT /metrics/{id}` with the provided payload.
- Validate `categoryId` and `originalMetricId` on update (return 404/400 instead of 500).
- Add max length constraints for `name`, `defaultUnit`, `description` in Zod + OpenAPI.

### 4. Schemathesis auth + seeded IDs (medium)

- Ensure `POST /auth/login` uses seeded credentials to avoid the auth warning.
- Extend seeded IDs for delete/update operations to reduce 404 warnings.
- Keep Schemathesis hooks aligned with validation (valid `tz`, skip register negative false positives).

### 5. Schema mismatches for metric logs/settings (medium)

- Align OpenAPI constraints for `POST /metric-logs` and `POST /metric-settings` with server validation (minimums, required fields when enabling goal/time frame).
- Update any validators that currently allow values the API rejects.

### 6. Verify + document (medium)

- Run `npm run docs:openapi:generate` after schema changes.
- Re-run `npm run contract:local:full`.
- Update `documents/tests/4-contract-tests/README.md` with any new validation behaviors and conflict responses.

## Progress

- [x] Align auth register schema with backend acceptance (isPublicProfile, passwordConfirmation).
- [x] Enforce strict analytics query validation + ASCII `last` regex.
- [x] Add `last` bounds + bucket-size guardrails to analytics validation/OpenAPI.
- [x] Normalize analytics `last` windows in Schemathesis hook.
- [x] Apply analytics query normalization for positive Schemathesis cases only (preserve negative coverage).
- [x] Enforce analytics range mode exclusivity (start/end vs last) in validators + docs to match Schemathesis expectations.
- [x] Harden analytics Schemathesis hook against list-valued bucket params.
- [x] Guard metric update reload against InstanceError to avoid 500s on PUT.
- [x] Resolve metric update 500s with non-empty update validation + safe partial updates (category/originalMetric handling).
- [x] Make metric + metric-settings update schemas strict in OpenAPI (minProperties + no unknown keys).
- [x] Ensure Schemathesis hook module loads reliably (PYTHONPATH + module import; no unsupported `--hooks` flag).
- [x] Improve Schemathesis auth/seeded IDs to reduce warnings.
- [x] Stabilize metric-settings updates with auto time frame enablement when dates are supplied.
- [x] Harden metric-settings achievement updates (avoid 500s on reload races; no body required for `/achieve`).
- [ ] Align metric logs/settings schemas with validation.
- [x] Re-run contract suite and update docs (Schemathesis + README).
