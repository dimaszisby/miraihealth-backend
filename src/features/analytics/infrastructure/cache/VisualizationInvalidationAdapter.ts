import type { VisualizationInvalidationPort } from "@/shared/application/ports/VisualizationInvalidationPort.js";
import { redisClient } from "@/utils/redis-client.js";

const SCAN_COUNT = 200;

export class AnalyticsVisualizationInvalidationAdapter
  implements VisualizationInvalidationPort
{
  async invalidateByMetric(userId: string, metricId: string): Promise<void> {
    if (!redisClient.isOpen) return;

    const singular = `viz:${userId}:${metricId}:*`;
    const dash = `vizdash:${userId}:*`;

    for await (const key of redisClient.scanIterator({
      MATCH: singular,
      COUNT: SCAN_COUNT,
    })) {
      await redisClient.del(key);
    }

    for await (const key of redisClient.scanIterator({
      MATCH: dash,
      COUNT: SCAN_COUNT,
    })) {
      await redisClient.del(key);
    }
  }
}
