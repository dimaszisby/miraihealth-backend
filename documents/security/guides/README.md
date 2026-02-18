# Security Guides Index

Start here if you are new to the Lakira security audit framework.

## Recommended Reading Order

1. Framework basics:

- `documents/security/guides/security-framework-junior-guide.md`

2. Command playbook:

- `documents/security/guides/security-scripts-usage-guide.md`

3. Release process:

- `documents/security/guides/security-release-delta-sop.md`

4. Deep references:

- `documents/security/framework/security-audit-framework.md`
- `documents/security/framework/security-audit-master-checklist.md`
- `documents/security/framework/risk-scoring-model.md`

## Quick Start

```bash
npm run security:audit:init -- --date YYYY-MM-DD
npm run security:delta:gate
```

Then update the current audit run docs under `documents/security/audit/audit-YYYY-MM-DD/`.
