# Housekeeping

TODO: Refactor the /analytics. In order to do that, we must do:

1. CI/CD setup (documents/ci-cd/\*\*) goes first so the pipeline enforces secret hygiene, required env vars, and test entrypoints before we touch security-sensitive code; otherwise the later work lands without guardrails.
2. JWT overhaul (documents/development/architecture/jwt/\*) rides on top of those CI upgrades: the refactored config, rotation flows, and new tests depend on having secrets wired through the workflows and scanners already in place.

Finally, we can do the subject:

- Tests overhaul (documents/development/architecture/feature-vertical-slice-migration/review-20251216/\*, e.g., …/test_overhaul_plan.md) should come last because it assumes the auth layer is stable and the pipeline can catch regressions; only then does it make sense to consolidate suites and tighten coverage.
