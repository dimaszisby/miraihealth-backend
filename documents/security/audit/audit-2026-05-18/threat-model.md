# Threat Model - 2026-05-18

**Status:** Precheck threat set (to be refreshed on run week)

| Threat Class                 | Primary Asset                           | Precheck Risk | Run-Week Focus                               |
| ---------------------------- | --------------------------------------- | ------------- | -------------------------------------------- |
| Privilege escalation         | User role integrity                     | Low           | Re-test register/profile role mutation paths |
| Broken object auth           | Tenant metric/log/settings data         | Low           | Re-run non-owner access checks               |
| API metadata exposure        | API contract/docs surface               | Low           | Re-verify docs auth guard defaults           |
| Runtime/TLS misconfiguration | DB credentials and in-transit data      | Medium        | Re-check env posture and deployment defaults |
| Abuse / DoS                  | API availability and analytics capacity | Medium        | Re-check rate-limit behavior and thresholds  |
| Dependency advisory drift    | Runtime dependency chain                | Low           | Re-run production dependency audit           |

## Scope

- Applies to backend API + runtime + CI security controls only.
