import type { ConsumeMessage } from "amqplib";
import { models } from "@/infrastructure/db/models.js";
import type { MetricAccessPort } from "../ports/MetricAccessPort.js";
import type { CachePort } from "../ports/CachePort.js";

type JobPayload = {
  jobId: string;
  userId: string;
  organizationId: string;
  metricId: string;
  count: number;
};

const TYPES: Array<"manual" | "automatic"> = ["manual", "automatic"];

export class GenerateDummyMetricLogsHandler {
  constructor(
    private access: MetricAccessPort,
    private cache: CachePort,
  ) {}

  async handle(msg: ConsumeMessage): Promise<void> {
    const payload = JSON.parse(msg.content.toString()) as JobPayload;
    const { userId, organizationId, metricId, count } = payload;

    await this.access.ensureMetricOwnership(userId, metricId);

    for (let i = 0; i < count; i++) {
      await models.MetricLog.create({
        metricId,
        organizationId,
        logValue: Number((Math.random() * 100).toFixed(2)),
        loggedAt: new Date(
          Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
        ),
        type: TYPES[Math.floor(Math.random() * TYPES.length)],
      });
    }

    if (this.cache.isEnabled()) {
      await this.cache.invalidate(userId, metricId);
    }
  }
}
