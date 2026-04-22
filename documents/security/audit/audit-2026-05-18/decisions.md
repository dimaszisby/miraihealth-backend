# Security Audit Decisions - 2026-05-18

| Decision ID            | Date       | Decision                                                          | Rationale                                                         |
| ---------------------- | ---------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| `ADR-SEC-20260518-001` | 2026-02-18 | Pre-fill the future-dated run package with precheck evidence.     | Reduces drift and context loss before scheduled run date.         |
| `ADR-SEC-20260518-002` | 2026-02-18 | Keep accepted-risk exception register empty for this precheck.    | No unresolved high/critical findings required exception handling. |
| `ADR-SEC-20260518-003` | 2026-02-18 | Keep `audit-YYYY-MM-DD` folder naming tied to scheduled run date. | Maintains chronology and machine-checkable indexing.              |

## Note

- Revisit decisions if run-week findings create new risk/exception requirements.
