# Security Audit Decisions - 2026-02-18

| Decision ID   | Date       | Decision                                                               | Rationale                                                          |
| ------------- | ---------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ADR-SEC-001` | 2026-02-18 | Adopt reusable framework + templates as the default run model.         | Standardized evidence and reduced one-off drift.                   |
| `ADR-SEC-002` | 2026-02-18 | Enforce soft CI gate for unresolved high/critical findings.            | Keeps release velocity while preventing severe risk carry-forward. |
| `ADR-SEC-003` | 2026-02-18 | Reject temporary exception for `SEC-20260218-001`; remediate in-cycle. | High-risk authz issue required immediate closure.                  |

## Notes

- No accepted-risk exception remained active at run close.
