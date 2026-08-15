# RabbitMQ — Decision Log

## ADR-001 — Use `amqp-connection-manager` over raw `amqplib` (Accepted 2026-04-20)

**Context:** `amqplib` has no built-in reconnect; a TCP close terminates all
in-flight publishes silently. Production brokers restart, network blips happen.

**Decision:** Use `amqp-connection-manager` v4, which wraps `amqplib`, adds
automatic reconnect with channel re-setup callbacks, and buffers publishes
while disconnected.

**Options considered:**

- Raw `amqplib` — leaner, but reconnect/buffer must be hand-rolled.
- `rhea` — AMQP 1.0 client; RabbitMQ 3.x has limited AMQP 1.0 support.
- BullMQ (Redis-backed) — already have Redis, but lacks exchange/routing semantics and durable broker guarantees.

**Consequences:** One extra dependency. API is a thin wrapper — migration to raw
`amqplib` is straightforward if needed.

---

## ADR-002 — Topic exchange `lakira.jobs` with parking-lot DLX (Accepted 2026-04-20)

**Context:** Need flexible per-job-type routing without a separate exchange per
feature. Also need a safe destination for poison messages.

**Decision:** Single topic exchange `lakira.jobs` with dotted routing keys
(`metric-log.generate-dummy`, future `email.send`, etc.). On handler failure,
`nack(false, false)` routes dead-lettered messages to `lakira.jobs.parking`
exchange → `lakira.jobs.parking.queue` (no consumer, monitored for depth > 0).

**Options considered:**

- Direct exchange per feature — simpler but doesn't scale to many event types.
- Fanout — wrong semantics for point-to-point job queues.
- Full tiered retry (TTL queues) — deferred; adds significant topology complexity
  for PR 1 scaffolding.

**Consequences:** Tiered backoff retry deferred to follow-up. Poison messages
park immediately after `RABBITMQ_MAX_RETRIES` nacks. Alert must be configured
on parking lot queue depth.

---

## ADR-003 — Separate publisher and consumer connections (Accepted 2026-04-20)

**Context:** RabbitMQ can apply a memory/disk alarm that blocks the publish
connection. If publish and consume share a connection, consumers freeze too.

**Decision:** `RabbitMQPublisher` and each `RabbitMQConsumer` create their own
`ChannelWrapper` on the shared `AmqpConnectionManager` instance. The connection
manager uses a single TCP connection per process; channels are multiplexed but
logically separate.

**Consequences:** Publisher block does not starve consumers. Each channel
re-asserts topology on reconnect via its own `setup` callback.

---

## ADR-004 — `processed_messages` table for idempotency (Accepted 2026-04-20)

**Context:** RabbitMQ is at-least-once. Network partitions and consumer restarts
cause redelivery. Without dedup, a handler may insert a DB row twice.

**Decision:** Add `processed_messages(message_id PK, queue, processed_at)`.
Consumer handlers check this table and insert inside the same DB transaction as
the side effect. A duplicate `message_id` triggers a PK conflict → handler
acks and skips.

**Consequences:** Extra DB write per message. Table grows unbounded — a periodic
cleanup job (delete rows older than N days) should be added in a follow-up.
