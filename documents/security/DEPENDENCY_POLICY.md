# Dependency Security Policy

**Status:** Active
**Last updated:** 2026-04-13

## Objective

Maintain secure and predictable dependency management for runtime and tooling packages.

## Scope

- Runtime dependencies (highest priority)
- Dev/test dependencies (tracked, lower priority unless CI/secret exposure risk)
- Direct + transitive packages in lockfile

## Core Rules

1. No direct fixes on protected branches without PR review.
2. Do not use `npm audit fix --force` as default remediation path.
3. Always commit lockfile changes with version updates.
4. Validate upgrades with static + test gates before merge.

## Required Signals

- Dependabot/advisory monitoring
- `npm audit --production` before release/staging deployment
- periodic full `npm audit` for dev/tooling posture

## Severity Response Targets

- Critical/High runtime: remediate or mitigate within 72h.
- Critical/High dev tooling: next sprint unless CI/secrets risk elevates urgency.
- Medium runtime: next maintenance window with owner/date.
- Low/Medium dev tooling: scheduled housekeeping.

## Verification Checklist for Upgrade PRs

- `npm run lint`
- `npm run typecheck`
- relevant tests for impacted surface
- `npm run docs:openapi:check` when generators/contracts may shift

## Exceptions

If no upstream fix exists, document temporary acceptance in audit decisions with:

- explicit rationale
- owner
- expiry date
- mitigation notes
