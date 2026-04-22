# Control Catalog Mapping (ASVS / Top 10 / SSDF)

**Status:** Active
**Last updated:** 2026-04-13

This catalog maps Lakira control domains to external standards so findings remain traceable.

| Control Domain                 | Internal IDs            | ASVS   | OWASP Top 10 (2021) | NIST SSDF        |
| ------------------------------ | ----------------------- | ------ | ------------------- | ---------------- |
| Architecture / Threat Modeling | LC-ARCH-\*              | V1     | A04                 | PO.1, PW.1, RV.1 |
| Authentication / Session       | LC-AUTH-_, LC-SESSION-_ | V2, V3 | A07                 | PW.6, RV.1       |
| Authorization                  | LC-AUTHZ-\*             | V4     | A01                 | PW.5, RV.1       |
| Input Validation               | LC-INPUT-\*             | V5     | A03                 | PW.5             |
| API Hardening / Config         | LC-API-_, LC-RUNTIME-_  | V14    | A05                 | PW.1, PW.6       |
| Data & Secrets                 | LC-DATA-\*              | V8, V9 | A02                 | PS.1, PW.4       |
| Logging / Incident Readiness   | LC-LOG-_, LC-IR-_       | V10    | A09                 | RV.3, PO.5       |
| Abuse Resistance               | LC-ABUSE-\*             | V7     | A04                 | PW.6, RV.1       |
| Dependency Security            | LC-SCA-\*               | V14.2  | A06                 | PO.3, RV.1       |
| CI/CD Security Gates           | LC-CICD-\*              | V1.14  | A05                 | PO.4, RV.1       |

## Usage Rules

- Every finding must map to at least one internal control ID.
- Findings should include at least one ASVS, Top 10, and SSDF reference.
- Update this file first when mapping standards versions change.
