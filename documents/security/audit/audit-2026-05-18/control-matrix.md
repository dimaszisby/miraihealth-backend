# Control Matrix - 2026-05-18

**Status:** Precheck baseline (run-week confirmation pending)
**Mapping baseline:** ASVS L2, OWASP Top 10 (2021), NIST SSDF

| Control Domain                  | Precheck Status | Gap Level     | Notes                                                           |
| ------------------------------- | --------------- | ------------- | --------------------------------------------------------------- |
| Architecture / trust boundaries | In place        | None          | Threat set documented; refresh on run week.                     |
| Authentication / session        | In place        | Low (monitor) | Contract + limiter controls are active.                         |
| Authorization                   | In place        | None          | Carry-forward critical authz issues remain closed.              |
| Input validation                | In place        | Low (monitor) | Validation and request guards in place.                         |
| API hardening                   | In place        | Low (monitor) | Docs auth + method/CORS posture currently aligned.              |
| Data/runtime config             | In place        | Low (monitor) | TLS/env defaults need re-check during run week.                 |
| Logging / error handling        | In place        | Low (monitor) | Sensitive output posture remains under review.                  |
| Abuse resistance                | In place        | Low (monitor) | Rate-limit controls active; thresholds re-validate in run week. |
| Dependency security             | In place        | None          | Precheck snapshot shows no unresolved production advisories.    |
| CI gate enforcement             | In place        | None          | Policy gate passes with zero blocking unresolved findings.      |
| Incident continuity             | In place        | None          | Incident/decision records available and linked.                 |

## Gap Summary

- High gaps: 0
- Medium gaps: 0
- Low monitor areas: runtime posture, abuse thresholds, logging hygiene
