# Security Audit Master Checklist

**Status:** Active
**Last updated:** 2026-04-13

Use this checklist as the canonical control set for full and delta audits.

| Control ID    | Domain              | Control Expectation                                    | Typical Evidence             | Severity if Failed |
| ------------- | ------------------- | ------------------------------------------------------ | ---------------------------- | ------------------ |
| LC-ARCH-01    | Architecture        | Trust boundaries and data flows documented             | `threat-model.md`            | High               |
| LC-AUTH-01    | Authentication      | Auth inputs validated; login abuse controls present    | auth schema/router refs      | High               |
| LC-AUTHZ-01   | Authorization       | Object-level authorization enforced                    | helper/service + tests       | Critical           |
| LC-SESSION-01 | JWT/Session         | JWT verification and required secret enforcement       | env schema + middleware      | High               |
| LC-INPUT-01   | Input Validation    | Body/query/path validated before use                   | validation middleware refs   | High               |
| LC-API-01     | API Hardening       | Docs/method/CORS exposure aligned with policy          | server/router refs           | Medium             |
| LC-DATA-01    | Data/Secrets        | Secrets required and secure transport defaults         | env/db config refs           | High               |
| LC-LOG-01     | Logging             | Sensitive data not exposed in logs/responses           | logger/error middleware refs | Medium             |
| LC-ABUSE-01   | Abuse Resistance    | Rate limits and test-only endpoint gating enforced     | limiter/router refs          | High               |
| LC-SCA-01     | Dependency Security | Production dependency scan triaged                     | audit artifacts/policy links | High               |
| LC-CICD-01    | CI Security Gate    | Delta gate executes and enforces policy                | workflow + gate output       | Critical           |
| LC-RUNTIME-01 | Runtime Hardening   | Production defaults avoid insecure test/debug behavior | env/runtime config refs      | High               |
| LC-IR-01      | Incident Readiness  | Security incidents/exceptions tracked with ownership   | decisions/incidents logs     | Medium             |

## Definition of Done

- Each control has status and evidence link in run-level checklist/matrix.
- Failed controls generate findings with owner + due date.
