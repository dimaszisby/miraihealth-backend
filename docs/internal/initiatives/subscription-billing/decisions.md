# Subscription & Billing — Decisions Log

---

## ADR-001 — BillingProvider port abstraction over direct Stripe SDK (Proposed 2026-05-03)

**Context:** The audit recommends a billing skeleton. Stripe is the most common choice, but forkers may prefer Lemon Squeezy, Paddle, or a custom gateway. The DDD architecture in this repo already uses ports for email (`EmailSender`), cache (`CachePort`), queue (`QueuePort`), and auth (`TokenProvider`).

**Decision (proposed):**

1. Define a `BillingProvider` port in `application/ports/BillingProvider.ts` with methods: `createCustomer`, `createCheckoutSession`, `createPortalSession`, `cancelSubscription`, `constructWebhookEvent`.
2. Implement `StripeBillingProvider` in `infrastructure/billing/StripeBillingProvider.ts`.
3. The port does NOT abstract away Stripe-specific webhook event types — the `HandleWebhookEvent` use case receives a provider-neutral event shape translated by the adapter.
4. Gated by `STRIPE_SECRET_KEY` env var — if not set, the billing feature does not register routes (graceful opt-out for forks that don't need billing yet).

**Status:** Proposed.

**Options considered:**

- _Direct Stripe SDK usage in use cases._ Rejected: violates the hexagonal architecture established by every other infrastructure concern in the repo.
- _Generic `PaymentProvider` name._ Rejected: `BillingProvider` is more accurate — it covers subscriptions, not one-off payments.

**Consequences:**

- Forkers swapping to Lemon Squeezy implement a new adapter; use cases don't change.
- Webhook signature verification is provider-specific — each adapter implements `constructWebhookEvent` differently.

**Links:**

- `docs/internal/audits/saas-readiness/audit-2026-05-01.md` § 9.2
- `subscription-billing-plan.md` § Phase B, Phase C

---

## ADR-002 — Subscription attaches to Organization, not User (Proposed 2026-05-03)

**Context:** With multi-tenancy (Phase 4), the billing entity could attach to either `User` or `Organization`. In a team-based SaaS, billing is per-organization (one subscription covers all members). In a consumer SaaS, billing is per-user.

**Decision (proposed):**

1. `Subscription.organizationId FK organizations(id)` — billing is per-organization.
2. One active subscription per organization (enforced by a unique partial index on `(organization_id) WHERE status IN ('active','trialing')`).
3. The `free` plan is the implicit default for organizations without an explicit subscription row.
4. `requirePlan("pro")` middleware reads the subscription for `req.organizationId`.

**Status:** Proposed.

**Options considered:**

- _Per-user billing._ Rejected: the multi-tenancy model uses organizations as the unit of isolation; billing should match.
- _Support both._ Rejected: premature flexibility. Forks targeting consumer use cases can change the FK.

**Consequences:**

- Hard dependency on Phase 4 (multi-tenancy). Cannot start schema work until `organizations` table exists.
- Org owners/admins manage billing; members see the plan but can't change it.

**Links:**

- `docs/internal/initiatives/multi-tenancy/multi-tenancy-plan.md`
- `subscription-billing-plan.md` § Phase A
