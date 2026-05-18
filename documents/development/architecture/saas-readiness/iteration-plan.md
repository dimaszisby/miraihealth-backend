# SaaS-Readiness Iteration Plan

**Owner:** @dimaszisby (single-developer)
**Cadence:** Iterative; no fixed deadline. Each phase is a self-contained PR.
**Source of truth for gap IDs:** [`audit-2026-05-01.md`](./audit-2026-05-01.md).
**Source of truth for the binary fork-ready gate:** ADR-001 in [`decisions.md`](./decisions.md).

This is the master roadmap for closing the 18 ❌ + 21 ⚠️ items in the audit. Each phase below has its own kit (or extends an existing kit) under `documents/development/architecture/`. P2-only items are deferred and not yet scaffolded.

## Phase Index

| #   | Phase                          | Kit folder                                                                                                 | Closes audit gaps                  | Effort | Status              | Gating ADR(s)                                       |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------ | ------------------- | --------------------------------------------------- |
| 0   | Cheap-P0 sweep                 | (no kit; ADR-006 in this folder)                                                                           | P0-6.1, P0-6.2, P0-11.1, P0-4.1    | S      | ✅ Done             | —                                                   |
| 1   | JWT lifecycle + refresh tokens | [`../jwt/`](../jwt/)                                                                                       | P0-1.1, P1-10.3                    | L      | ⏳ Scaffolded       | ADR-001 (kit-local)                                 |
| 2   | Observability foundations      | [`../observability/`](../observability/)                                                                   | P0-5.1, P1-5.2, P1-5.3, P1-4.3     | M      | ⏳ Scaffolded       | —                                                   |
| 3   | Email verification             | [`../email-verification/`](../email-verification/)                                                         | P1-1.2                             | M      | ⏳ Scaffolded       | —                                                   |
| 4   | Multi-tenancy foundation       | [`../multi-tenancy/`](../multi-tenancy/)                                                                   | P0-3.1, P0-9.1, P1-1.3             | L      | ⏳ Blocked          | ADR-004 (this folder) must flip Proposed → Accepted |
| 5   | Architecture drift cleanup     | [`../feature-vertical-slice-migration/`](../feature-vertical-slice-migration/) (existing kit, new tracker) | P1-10.1, P1-10.2, P2-10.4, P2-10.5 | M      | ⏳ Blocked          | ADR-003 (this folder) must flip Proposed → Accepted |
| 6   | Forkability scaffolding        | [`../forkability/`](../forkability/)                                                                       | P1-11.2, P1-11.3, P1-11.4, P2-11.5 | M      | ⏳ Scaffolded       | —                                                   |
| 7   | Production runtime + CI/CD     | [`../production-readiness/`](../production-readiness/)                                                     | P1-8.3, P1-8.4, P1-4.4, P1-7.1     | M      | ⏳ Scaffolded       | —                                                   |
| 8   | Subscription model             | [`../subscription-billing/`](../subscription-billing/)                                                     | P1-9.2                             | L      | 🅿️ Deferred kickoff | Phase 4 must complete first                         |

Status legend: ⏳ Scaffolded = doc kit exists, no code yet · ⏳ Ready to kick off = no kit, single ADR is the artifact · ⏳ Blocked = kit exists but a Proposed ADR must be Accepted before code starts · 🅿️ Deferred = scaffold only; do not start.

## Recommended Execution Order

1. **Phase 0** first (S-effort, ~1 day total). Closes 4 P0s including LICENSE + README + .env.example, immediately satisfying fork-ready exit criterion #4.
2. **Phase 1** next. Refresh tokens + verify-port leak block any cleanup of auth.
3. **Phase 2** in parallel with 1 if context allows — observability has no overlap with auth code.
4. **Phase 3** (email verification) builds on Phase 1's TokenProvider.verify() extension.
5. **Phase 6** (forkability) can interleave whenever a small slot opens — most items are S-effort.
6. **Phase 7** (production runtime) before any production traffic.
7. **Phase 4** (multi-tenancy) once ADR-004 is Accepted. Largest effort; touches every domain table.
8. **Phase 5** (drift cleanup) after multi-tenancy's table changes settle, since drift fixes will collide with `organization_id` migrations.
9. **Phase 8** (subscription) once Phase 4 lands — billing is per-organization.

## Per-Phase Kit Map

Each kit's `README.md` ends with the same cross-reference block so the audit re-runs can mechanically verify mapping:

```md
## References

- **Closes audit gaps:** [P0-X.Y], [P1-A.B] in `documents/development/architecture/saas-readiness/audit-2026-05-01.md`
- **Owning ADRs:** ADR-NNN in `documents/development/architecture/saas-readiness/decisions.md`; (kit-local) ADR-001 in `./decisions.md`
- **Effort:** S/M/L
- **Status:** Proposed | In progress | Accepted
- **Predecessor / dependency:** (e.g., "depends on Phase 1 completing the TokenProvider.verify() extension")
```

When a phase ships, the row in this file moves from ⏳ Scaffolded → ✅ Done with a link to the merged PR. The audit re-run script can then auto-mark the closed gap IDs as ✅ in the next dated audit file.

## P2-Only Items (Deferred — Not Scaffolded)

These items in `audit-2026-05-01.md` are not blocking and have no kit yet. Open one when the work is up next:

- P2-1.4 — OAuth / social login
- P2-2.2 — Shared `Page<T>` pagination helper
- P2-3.3 — Dev/test seed scripts
- P2-4.5 — CORS multi-origin
- P2-4.6 — `xss-clean` retirement
- P2-5.4 — APM / metrics readiness (Prometheus)
- P2-9.3 — General feature-flag system
- P2-9.4 — Outbound webhook delivery

## Maintenance Rules

- **Append-only:** finished phases keep their row (status → ✅ Done with PR link). Do not delete.
- **One mutable surface:** the **Status** column of each row. Everything else describes intent and should not change.
- **Cross-link bidirectionally:** every kit's `README.md` references this file in its "Predecessor / dependency" line; this file references every kit folder.
- **Rerun audit after each phase:** generate a new dated `audit-YYYY-MM-DD.md`; diff its scorecard against `audit-2026-05-01.md` so the closed gaps are visible in the public `SAAS-BASE-CHECKLIST.md`.
