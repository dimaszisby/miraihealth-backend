import { redisClient } from "@/utils/redis-client";
import crypto from "node:crypto";
import { FillMode } from "../../domain/types";
import { DurationISO } from "../../domain/buckets";

// Dev Note: currently not set in .env, will be set later
const TTL = Number(process.env.VIZ_DEFAULT_TTL_SEC ?? 120);

export async function getCachedViz<T>(key: string): Promise<T | null> {
  const json = await redisClient.get(key);
  return json ? (JSON.parse(json) as T) : null;
}

export async function setCachedViz(key: string, value: unknown) {
  await redisClient.set(key, JSON.stringify(value), { EX: TTL });
}

/**
 * * Invalidation rules:
 *  - when a MetricSettings.displayOptions.showOnDashboard/priority changes
 *  - when Metric created/deleted
 *  - when any metric logs change (coarse: user-scoped prefix delete)
 */
export async function invalidateVizByMetric(userId: string, metricId: string) {
  // Narrow deletions are ideal, but a simple prefix delete is fine to start.
  // If you use Redis >= 6.2 with lazy deletion:
  const pattern = `viz:${userId}:${metricId}:*`;

  // implement SCAN + DEL to avoid blocking
  let cursor = 0;
  do {
    // @ts-ignore
    const [next, keys] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      200
    );
    cursor = Number(next);
    if (keys.length) await redisClient.del(...keys);
  } while (cursor !== 0);
}

// Singular Viz Key
export function vizKey(input: {
  userId: string;
  metricId: string;
  startISO: string;
  endISO: string;
  bucketIso: DurationISO;
  tz: string;
  fill: FillMode;
}) {
  const raw = `${input.userId}|${input.metricId}|${input.bucketIso}|${input.startISO}|${input.endISO}|${input.tz}|${input.fill}`;
  const hash = crypto
    .createHash("sha1")
    .update(raw)
    .digest("base64url")
    .slice(0, 16);
  return `viz:${input.userId}:${input.metricId}:${input.bucketIso}:${hash}`;
}

// Dashboard Viz Key
export function vizDashKey(input: {
  userId: string;
  metricIds: string[]; // must be sorted before hashing
  startISO: string;
  endISO: string;
  bucketIso: DurationISO;
  tz: string;
  fill: FillMode;
}) {
  const raw = `${input.userId}|${input.metricIds.join(",")}|${input.bucketIso}|${input.startISO}|${input.endISO}|${input.tz}|${input.fill}`;
  const hash = crypto
    .createHash("sha1")
    .update(raw)
    .digest("base64url")
    .slice(0, 16);
  return `vizdash:${input.userId}:${input.bucketIso}:${hash}`;
}
