import { redisClient } from "@/utils/redis-client";
import crypto from "node:crypto";
import { FillMode } from "../../domain/types";
import { DurationISO } from "../../domain/buckets";

// Dev Note: currently not set in .env, will be set later
const TTL = Number(process.env.VIZ_DEFAULT_TTL_SEC ?? 120);

export async function getCachedViz<T>(key: string): Promise<T | null> {
  if (!redisClient.isOpen) return null;
  const json = await redisClient.get(key);
  return json ? (JSON.parse(json) as T) : null;
}

export async function setCachedViz(key: string, value: unknown) {
  if (!redisClient.isOpen) return;
  await redisClient.set(key, JSON.stringify(value), { EX: TTL });
}

/**
 * * Invalidation rules:
 *  - when a MetricSettings.displayOptions.showOnDashboard/priority changes
 *  - when Metric created/deleted
 *  - when any metric logs change (coarse: user-scoped prefix delete)
 */
export async function invalidateVizByMetric(userId: string, metricId: string) {
  if (!redisClient.isOpen) return;

  // singular viz keys
  const singular = `viz:${userId}:${metricId}:*`;
  // dashboards (any set may include this metric) – coarse but safe
  const dash = `vizdash:${userId}:*`;

  // node-redis v4 scanIterator avoids blocking and weird tuple responses
  for await (const key of redisClient.scanIterator({
    MATCH: singular,
    COUNT: 200,
  })) {
    await redisClient.del(key);
  }
  for await (const key of redisClient.scanIterator({
    MATCH: dash,
    COUNT: 200,
  })) {
    await redisClient.del(key);
  }
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
  versionCursor?: string;
}) {
  const raw = `${input.userId}|${input.metricIds.join(",")}|${input.bucketIso}|${input.startISO}|${input.endISO}|${input.tz}|${input.fill}|${input.versionCursor ?? ""}`;
  const hash = crypto
    .createHash("sha1")
    .update(raw)
    .digest("base64url")
    .slice(0, 16);
  return `vizdash:${input.userId}:${input.bucketIso}:${hash}`;
}
