# ADR-0005 — Topic exchange `lakira.jobs` with parking-lot DLX

- **Status:** Accepted
- **Date:** 2026-04-20
- **Origin:** `ADR-002` in the RabbitMQ kit — [`rabbitmq`](../../internal/initiatives/rabbitmq/decisions.md)

---

## Context

Need flexible per-job-type routing without a separate exchange per
feature. Also need a safe destination for poison messages.

## Decision

Single topic exchange `lakira.jobs` with dotted routing keys
(`metric-log.generate-dummy`, future `email.send`, etc.). On handler failure,
`nack(false, false)` routes dead-lettered messages to `lakira.jobs.parking`
exchange → `lakira.jobs.parking.queue` (no consumer, monitored for depth > 0).

## Options considered

- Direct exchange per feature — simpler but doesn't scale to many event types.
- Fanout — wrong semantics for point-to-point job queues.
- Full tiered retry (TTL queues) — deferred; adds significant topology complexity
  for PR 1 scaffolding.

## Consequences

Tiered backoff retry deferred to follow-up. Poison messages
park immediately after `RABBITMQ_MAX_RETRIES` nacks. Alert must be configured
on parking lot queue depth.

---
