# PR Summary

## What Changed

-

## Why

-

## Validation Checklist

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run test:integration` (required for API/persistence/migration changes)
- [ ] `npm run docs:openapi:check` (required for API/schema changes)

## Security Checklist

- [ ] `npm run test:unit:security-framework`
- [ ] `npm run security:delta:gate`
- [ ] Updated security audit artifacts when required (`docs/security/audit/**`)
- [ ] For production release PRs: followed `docs/security/guides/security-release-delta-sop.md`

## Notes For Reviewers

- CI artifact to inspect for security gate runs: `backend-security-delta`
