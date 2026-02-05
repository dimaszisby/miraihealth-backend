# Contract Test Pipeline Overview – Lakira Backend

## 1. Purpose

This document describes **how** Postman/Newman contract tests fit into the Lakira **CI/CD pipeline**, which environments they run against, and how they act as a **gate** for backend changes that impact client-facing APIs.

---

## 2. Pipeline Position

A typical Lakira pipeline (high-level):

```text
commit / PR
  ↓
Build & Lint
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
Deploy Test/Staging Environment
  ↓
Contract Tests (Postman/Newman)
  ↓
End-to-End Tests (optional)
  ↓
Deploy to Production (manual or automated)
```

## 3. Contract-specific guardrails

- **JSON bodies must be objects.** Every POST/PUT/PATCH endpoint now runs a guard that rejects scalar payloads with a `400` before Zod parsing. When fuzzing with Schemathesis, send `{}` if you want to probe “empty body” behaviour.
- **Metric settings invariants.** When `goalEnabled=true`, both `goalType` and `goalValue` are mandatory; turning on `timeFrameEnabled` simultaneously requires `startDate` and `deadlineDate`. The OpenAPI contract documents this via `oneOf`, so tests should mirror those pairings.
- **Metric log creation requires `type`.** The server no longer defaults to `"manual"`, so the contract harness must include the field explicitly.
- **Cursor queries are strict.** `/metrics`, `/metric-logs`, `/metric-settings`, and `/metric-categories` trim `q`, forbid blank queries, and reject unknown `filter[...]` keys. Schemathesis will therefore see deterministic 400s for malformed parameters; treat them as expected rather than regressions.
- **Seeded IDs.** Happy-path requests should reuse IDs emitted by `npm run seed:contract-tests` (see `tmp/contract-seed.json`). Random UUIDs will continue to 404 because ownership checks are enforced.
