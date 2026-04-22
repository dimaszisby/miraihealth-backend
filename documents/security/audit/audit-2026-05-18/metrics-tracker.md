# Security Metrics - 2026-05-18

**Status:** Precheck snapshot (2026-02-18); run-week refresh pending

| Metric                                          | Target                     | Precheck Snapshot | Run-Week Status |
| ----------------------------------------------- | -------------------------- | ----------------- | --------------- |
| Open critical findings                          | 0                          | 0                 | Pending refresh |
| Open high findings                              | 0                          | 0                 | Pending refresh |
| CI gate blocking unresolved high/critical       | 0                          | 0                 | Pending refresh |
| Dependency production advisory backlog          | 0 unresolved high/critical | 0                 | Pending refresh |
| Evidence completeness (findings -> remediation) | 100%                       | 100%              | Pending refresh |

## Required Refresh Inputs

- `tmp/security/security-delta-report.json`
- `tmp/security/security-gate-result.json`
- `tmp/security/npm-audit-production.json`
