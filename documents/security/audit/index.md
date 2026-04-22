# Security Audit Index

**Status:** Active
**Last updated:** 2026-04-13

Tracks dated security audit runs and their lifecycle state.

| Run Date   | Folder                                      | Run Type                    | Status            | Notes                                                                                 |
| ---------- | ------------------------------------------- | --------------------------- | ----------------- | ------------------------------------------------------------------------------------- |
| 2025-11-21 | `documents/security/audit/audit-2025-11-21` | Historical baseline review  | Archived snapshot | Detailed logs compacted for token efficiency; retrieve full details from git history. |
| 2026-02-18 | `documents/security/audit/audit-2026-02-18` | Framework-driven full audit | Completed         | Current-cycle findings closed; compact evidence summaries retained.                   |
| 2026-05-18 | `documents/security/audit/audit-2026-05-18` | Quarterly planned run       | Planned           | Pre-filled run kit; execution-week evidence refresh pending.                          |

## Cadence Policy

- Full security audit: quarterly.
- Delta audit: before production release.
- Additional delta audit: after major security incidents/architecture shifts.

## Maintenance Rules

- Update this index whenever run status changes.
- Keep each run folder internally consistent with framework artifact requirements.
- For compacted historical artifacts, include retrieval commands inside each file.
