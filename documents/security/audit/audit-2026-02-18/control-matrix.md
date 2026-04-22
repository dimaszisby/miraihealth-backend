# Control Matrix - 2026-02-18

**Status:** Completed run snapshot (compacted 2026-04-13)
**Mapping baseline:** ASVS L2, OWASP Top 10 (2021), NIST SSDF

| Control Domain                  | Coverage                                             | Gap Level     | Linked Findings                                            |
| ------------------------------- | ---------------------------------------------------- | ------------- | ---------------------------------------------------------- |
| Architecture / trust boundaries | Threat model and core boundaries documented          | None          | None                                                       |
| Authentication / session        | Input + rate-limit controls validated                | Low (monitor) | `SEC-20260218-006`                                         |
| Authorization                   | Object-level ownership and role protection validated | None          | `SEC-20260218-001`, `SEC-20260218-007`                     |
| Input validation                | Validation chain and JSON guards verified            | Low (monitor) | None                                                       |
| API hardening                   | Method/CORS/docs guard posture verified              | Low (monitor) | `SEC-20260218-002`, `SEC-20260218-008`                     |
| Data / runtime config           | TLS + env defaults reviewed                          | Low (monitor) | None                                                       |
| Logging / error handling        | Sensitive output posture reviewed                    | Low (monitor) | None                                                       |
| Abuse resistance                | Global/user limiter controls reviewed                | Low (monitor) | None                                                       |
| Dependency security             | Production advisory triage completed                 | None          | `SEC-20260218-003`, `SEC-20260218-004`, `SEC-20260218-005` |
| CI gate enforcement             | Gate policy + artifact outputs verified              | None          | None                                                       |
| Incident continuity             | Run continuity and incident logging validated        | Low (monitor) | None                                                       |

## Gap Summary

- High gaps: 0
- Medium gaps: 0
- Low residual monitor areas: auth/session, API hardening, runtime/logging, abuse controls
