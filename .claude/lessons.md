# Claude Lessons — Lakira Backend

Persistent record of corrections and patterns learned on this project.
Updated after any correction per `.claude/rules/workflow.md`.

---

<!-- Entries added below as lessons are learned. Format:
## [YYYY-MM-DD] <short title>
**Mistake**: what went wrong
**Rule**: the pattern to follow instead
**Why**: reason / context
-->

## [2026-04-22] Regenerate OpenAPI spec and update tests after endpoint schema changes

**Mistake**: Removed `metricId` from the request body schema but (1) did not regenerate the OpenAPI spec, causing a typecheck failure in CI, and (2) did not update unit tests that still passed `metricId` in `req.body` instead of `req.params`.
**Rule**: After any change to endpoint structure (params, body, query, response shape):

1. Run `npm run docs:openapi:generate` and commit the updated spec.
2. Update all unit and integration tests — check mock `req` objects for any field that moved (e.g. body → params) and update assertions accordingly.
   **Why**: `openapi-schemas.ts` examples must match the current Zod schema shape or typecheck fails. Unit test `req` mocks must reflect the actual request structure or controller assertions will fail. Both are CI gates.
