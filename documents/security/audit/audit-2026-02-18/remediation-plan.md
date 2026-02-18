# Remediation Plan - 2026-02-18

- Generated (UTC): 2026-02-18T08:36:30Z

| remediation_id   | finding_id       | action                                                                                                               | owner            | priority | target_date | status  | verification_evidence                                                                                                                     |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------- | -------- | ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| REM-20260218-001 | SEC-20260218-001 | Remove `role` from profile update schema/controller/use case and add regression tests proving user role immutability | backend-security | High     | 2026-02-25  | Planned | `src/features/auth/infrastructure/http/schema.zod.ts`, `src/features/auth/application/use-cases/UpdateProfile.ts`, auth integration tests |
| REM-20260218-002 | SEC-20260218-002 | Add `PATCH` to server CORS methods and add config test to keep method list aligned with route surface                | backend-platform | Medium   | 2026-03-20  | Planned | `src/server.ts`, route/method alignment checks                                                                                            |
| REM-20260218-003 | SEC-20260218-003 | Upgrade affected dependency chain to patched `ajv` path and capture clean audit delta output                         | backend-platform | Medium   | 2026-03-20  | Planned | `package-lock.json`, `tmp/security/npm-audit-production.json`                                                                             |
| REM-20260218-004 | SEC-20260218-004 | Upgrade/override vulnerable `lodash` path and validate no new regressions in CI                                      | backend-platform | Medium   | 2026-03-20  | Planned | dependency upgrade PR, CI results, audit artifact                                                                                         |
| REM-20260218-005 | SEC-20260218-005 | Track `qs` advisory in maintenance backlog and resolve in 2026 Q2 dependency sweep                                   | backend-platform | Low      | 2026-05-19  | Planned | dependency policy snapshot update                                                                                                         |
| REM-20260218-006 | SEC-20260218-006 | Keep register-role controls covered by tests and do not reintroduce user-controlled role assignment                  | backend-security | Critical | 2025-11-22  | Done    | historical fix validation (`RegisterUser`, schema)                                                                                        |
| REM-20260218-007 | SEC-20260218-007 | Keep ownership enforcement for metric resources and preserve authorization tests                                     | backend-security | Critical | 2025-11-22  | Done    | `src/utils/db-helper.ts` ownership checks                                                                                                 |
| REM-20260218-008 | SEC-20260218-008 | Keep Swagger auth guard enabled in non-local environments                                                            | backend-security | High     | 2025-11-28  | Done    | `SWAGGER_REQUIRE_AUTH` default and guarded routes                                                                                         |

## SLA Targets

- Critical: mitigation plan within 24h
- High: mitigation plan within 7 days
- Medium: mitigation plan within 30 days
- Low: planned backlog within 90 days

## Definition of Done

- Every open finding is mapped to a remediation task.
- Completed tasks include concrete verification evidence references.
