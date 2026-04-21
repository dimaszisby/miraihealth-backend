import type { Channel } from "amqplib";

export const EXCHANGES = {
  JOBS: "lakira.jobs",
  PARKING: "lakira.jobs.parking",
} as const;

export const QUEUES = {
  METRIC_LOG_GENERATE_DUMMY: "lakira.metric-log.generate-dummy",
  PARKING: "lakira.jobs.parking.queue",
} as const;

export const ROUTING_KEYS = {
  METRIC_LOG_GENERATE_DUMMY: "metric-log.generate-dummy",
} as const;

export const assertTopology = async (channel: Channel): Promise<void> => {
  await channel.assertExchange(EXCHANGES.JOBS, "topic", { durable: true });
  await channel.assertExchange(EXCHANGES.PARKING, "topic", { durable: true });

  await channel.assertQueue(QUEUES.METRIC_LOG_GENERATE_DUMMY, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": EXCHANGES.PARKING,
    },
  });
  await channel.bindQueue(
    QUEUES.METRIC_LOG_GENERATE_DUMMY,
    EXCHANGES.JOBS,
    ROUTING_KEYS.METRIC_LOG_GENERATE_DUMMY,
  );

  // Parking lot — no consumer, monitored for depth > 0
  await channel.assertQueue(QUEUES.PARKING, { durable: true });
  await channel.bindQueue(QUEUES.PARKING, EXCHANGES.PARKING, "#");
};
