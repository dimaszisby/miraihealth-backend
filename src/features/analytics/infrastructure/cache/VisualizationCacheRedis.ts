import { redisClient } from "@/utils/redis-client";
import crypto from "node:crypto";
import {
  VisualizationCachePort,
  SingleVizCacheKey,
  DashboardVizCacheKey,
} from "../../application/ports/VisualizationCachePort";

const TTL = Number(process.env.VIZ_DEFAULT_TTL_SEC ?? 120);

export class VisualizationCacheRedis implements VisualizationCachePort {
  async getSingleVisualization(params: SingleVizCacheKey) {
    if (!redisClient.isOpen) return null;
    const key = vizKey(params);
    const json = await redisClient.get(key);
    return json ? (JSON.parse(json) as any) : null;
  }

  async setSingleVisualization(params: SingleVizCacheKey, value: unknown) {
    if (!redisClient.isOpen) return;
    const key = vizKey(params);
    await redisClient.set(key, JSON.stringify(value), { EX: TTL });
  }

  async getDashboardVisualization(params: DashboardVizCacheKey) {
    if (!redisClient.isOpen) return null;
    const key = vizDashKey(params);
    const json = await redisClient.get(key);
    return json ? (JSON.parse(json) as any) : null;
  }

  async setDashboardVisualization(
    params: DashboardVizCacheKey,
    value: unknown
  ) {
    if (!redisClient.isOpen) return;
    const key = vizDashKey(params);
    await redisClient.set(key, JSON.stringify(value), { EX: TTL });
  }
}

function vizKey(input: SingleVizCacheKey) {
  const raw = `${input.userId}|${input.metricId}|${input.bucketIso}|${input.startISO}|${input.endISO}|${input.tz}|${input.fill}`;
  const hash = crypto
    .createHash("sha1")
    .update(raw)
    .digest("base64url")
    .slice(0, 16);
  return `viz:${input.userId}:${input.metricId}:${input.bucketIso}:${hash}`;
}

function vizDashKey(input: DashboardVizCacheKey) {
  const raw = `${input.userId}|${input.metricIds.join(",")}|${input.bucketIso}|${input.startISO}|${input.endISO}|${input.tz}|${input.fill}|${input.versionCursor ?? ""}`;
  const hash = crypto
    .createHash("sha1")
    .update(raw)
    .digest("base64url")
    .slice(0, 16);
  return `vizdash:${input.userId}:${input.bucketIso}:${hash}`;
}
