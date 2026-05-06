---
name: JWT Refresh Token Phase D Review
description: Summary of key patterns and violations found in the feat/jwt-refresh-tokens PR review
type: project
---

Phase D of the JWT overhaul (ADR-001/002) introduced opaque refresh tokens stored in PostgreSQL with SHA-256 hashing, family rotation, and reuse detection via HttpOnly cookie. Core design is sound.

**Key DDD violation confirmed:** `IssueRefreshToken`, `RotateRefreshToken`, and `RevokeRefreshTokenFamily` (all application layer) import directly from `../../infrastructure/providers/RefreshTokenCrypto.js`. The crypto helpers (`generateRawRefreshToken`, `hashRefreshToken`) must be extracted into an application-layer port (e.g., `TokenCrypto`) to preserve layer separation.

**Why:** This is a hard architectural rule in this codebase; ESLint enforces banned import paths. The violation is currently tolerated only because `RefreshTokenCrypto.ts` is pure Node.js crypto with no framework deps, but the pattern is wrong and will compound.

**How to apply:** In future reviews, flag any application-layer use case that imports from `infrastructure/providers/`.
