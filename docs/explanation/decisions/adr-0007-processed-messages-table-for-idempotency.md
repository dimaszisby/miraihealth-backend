# ADR-0007 — `processed_messages` table for idempotency

- **Status:** Accepted
- **Date:** 2026-04-20
- **Origin:** `ADR-004` in the RabbitMQ kit — [`rabbitmq`](../../internal/initiatives/rabbitmq/decisions.md)

---

## Context

RabbitMQ is at-least-once. Network partitions and consumer restarts
cause redelivery. Without dedup, a handler may insert a DB row twice.

## Decision

Add `processed_messages(message_id PK, queue, processed_at)`.
Consumer handlers check this table and insert inside the same DB transaction as
the side effect. A duplicate `message_id` triggers a PK conflict → handler
acks and skips.

## Consequences

Extra DB write per message. Table grows unbounded — a periodic
cleanup job (delete rows older than N days) should be added in a follow-up.
