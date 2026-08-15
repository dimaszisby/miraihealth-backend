# Security Guides Index

Start here if you are new to the Lakira security audit framework.

## Recommended Reading Order

1. Framework basics:

- `docs/security/guides/security-framework-junior-guide.md`

2. Command playbook:

- `docs/security/guides/security-scripts-usage-guide.md`

3. Release process:

- `docs/security/guides/security-release-delta-sop.md`

4. Branch-based execution workflow:

- `docs/security/guides/security-audit-workflow-branch-model.md`

5. Deep references:

- `docs/security/framework/security-audit-framework.md`
- `docs/security/framework/security-audit-master-checklist.md`
- `docs/security/framework/risk-scoring-model.md`

## Quick Start

```bash
npm run security:audit:init -- --date YYYY-MM-DD
npm run security:delta:gate
```

Then update the current audit run docs under `docs/security/audit/audit-YYYY-MM-DD/`.
