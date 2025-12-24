# Static Checks Metrics Tracker

| Metric                   | Target              | Baseline (date)                    | Current (date)                                                    | Owner          | Next Action / Link                                             |
| ------------------------ | ------------------- | ---------------------------------- | ----------------------------------------------------------------- | -------------- | -------------------------------------------------------------- |
| ESLint runtime           | ≤ 3m local, ≤ 2m CI | 7.63s (2025-02-14, `npm run lint`) | 7.50s (2025-02-14) — passes after removing stray compiled JS test | @dimaspramudya | Monitor after CI cache work; ensure lint stays <2m in CI       |
| Typecheck runtime        | ≤ 4m local, ≤ 3m CI | 7.23s (failing, 2025-02-14)        | 9.14s (2025-02-14) — passing after `.js` suffix rollout           | @dimaspramudya | Monitor after further refactors; investigate perf if >10s      |
| Format violations per PR | 0 (fail fast)       | _TBD_                              | 0 (2025-02-14) — `npm run format:check` clean after repo format   | @dimaspramudya | Wire `format:check` into CI to prevent regressions             |
