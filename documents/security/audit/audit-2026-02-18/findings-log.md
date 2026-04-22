# Findings Log - 2026-02-18

**Status:** Closed snapshot (no unresolved high/critical at close)

| Finding ID         | Severity                         | Theme                          | Status          | Notes                                                                        |
| ------------------ | -------------------------------- | ------------------------------ | --------------- | ---------------------------------------------------------------------------- |
| `SEC-20260218-001` | High                             | Profile role mutation risk     | Verified Closed | `role` removed from profile update contract and covered by regression tests. |
| `SEC-20260218-002` | Medium                           | CORS method mismatch           | Verified Closed | PATCH added to CORS allowlist; route/CORS parity restored.                   |
| `SEC-20260218-003` | Medium                           | Dependency advisory (`ajv`)    | Verified Closed | Runtime dependency chain remediated.                                         |
| `SEC-20260218-004` | Medium                           | Dependency advisory (`lodash`) | Verified Closed | Runtime dependency chain remediated.                                         |
| `SEC-20260218-005` | Low                              | Dependency advisory (`qs`)     | Verified Closed | Runtime dependency chain remediated.                                         |
| `SEC-20260218-006` | Critical (historical carry-over) | Register role escalation       | Verified Closed | Prior critical finding retained for continuity and revalidated closed.       |
| `SEC-20260218-007` | Critical (historical carry-over) | Object-level auth bypass       | Verified Closed | Prior critical finding retained for continuity and revalidated closed.       |
| `SEC-20260218-008` | High (historical carry-over)     | Docs exposure posture          | Verified Closed | Docs guard defaults and route behavior remain hardened.                      |

## Open Findings Snapshot

- Open Critical: 0
- Open High: 0
- Open Medium: 0
- Open Low: 0
