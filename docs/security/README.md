# Security Program Documentation - Lakira Backend

## Overview

This directory contains the reusable, versioned security audit framework for the Lakira backend.
The framework is designed for production-grade engineering rigor and portfolio-ready traceability.

## Scope

- Backend application code and API security controls.
- Dependency and supply-chain security posture.
- CI/CD security guardrails and release gate rules.
- Runtime and configuration hardening for staging/production.

Out of scope for this v1 framework:

- Frontend-only security controls.
- Sector-specific compliance frameworks (HIPAA, PCI DSS, GDPR-only programs).

## Baseline Standards

- OWASP ASVS v4 Level 2 (primary control baseline).
- OWASP Top 10 (risk taxonomy and communication layer).
- NIST SSDF (secure SDLC process baseline).

## Cadence

- Full in-depth audit: quarterly.
- Delta security audit: before production releases.
- Emergency delta audit: after critical incidents or major architecture changes.

## Navigation

- Framework core: `docs/security/framework/`
- Reusable audit templates: `docs/security/templates/audit-run/`
- Audit run history: `docs/security/audit/index.md`
- Dependency policy: `docs/security/DEPENDENCY_POLICY.md`
- Junior/new developer guides: `docs/security/guides/`
  - Guide index: `docs/security/guides/README.md`
  - Framework basics: `docs/security/guides/security-framework-junior-guide.md`
  - Script usage: `docs/security/guides/security-scripts-usage-guide.md`
  - Release delta SOP: `docs/security/guides/security-release-delta-sop.md`
  - Branch model workflow: `docs/security/guides/security-audit-workflow-branch-model.md`

## Ownership and Workflow

- Primary owner: Backend Engineering.
- Security findings must map to framework controls and evidence references.
- Critical and high findings are enforced via CI soft gate policy.

## Implementation Policy

- New audits must follow folder pattern: `docs/security/audit/audit-YYYY-MM-DD`.
- Every audit run must include all required artifacts defined in the template kit.
- UTC timestamps are required for generated evidence and automation outputs.
