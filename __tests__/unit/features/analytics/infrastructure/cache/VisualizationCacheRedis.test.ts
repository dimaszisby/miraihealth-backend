import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { VisualizationCacheRedis } from "@/features/analytics/infrastructure/cache/VisualizationCacheRedis.js";
import type {
  FillMode,
  VizResponse,
  DashboardVizResponse,
} from "@/features/analytics/domain/types.js";
import crypto from "node:crypto";
import type {
  SingleVizCacheKey,
  DashboardVizCacheKey,
} from "@/features/analytics/application/ports/VisualizationCachePort.js";
import type { BucketAlias } from "@/features/analytics/domain/buckets.js";

jest.mock("@/utils/redis-client.js", () => ({
  redisClient: {
    isOpen: true,
    get: jest.fn(),
    set: jest.fn(),
  },
}));

const { redisClient } = jest.requireMock("@/utils/redis-client.js") as {
  redisClient: {
    isOpen: boolean;
    get: jest.MockedFunction<(key: string) => Promise<string | null>>;
    set: jest.MockedFunction<
      (key: string, value: string, options: { EX: number }) => Promise<void>
    >;
  };
};

const cache = new VisualizationCacheRedis();

const singleKey: SingleVizCacheKey = {
  userId: "user-1",
  metricId: "metric-2",
  bucket: "1d" as BucketAlias,
  bucketIso: "1d",
  startISO: "2024-01-01T00:00:00.000Z",
  endISO: "2024-01-31T00:00:00.000Z",
  tz: "UTC",
  fill: "zero" as FillMode,
};

const dashKey: DashboardVizCacheKey = {
  userId: "user-1",
  metricIds: ["metric-2", "metric-3"],
  bucket: "1w" as BucketAlias,
  bucketIso: "1w",
  startISO: "2024-01-01T00:00:00.000Z",
  endISO: "2024-02-01T00:00:00.000Z",
  tz: "UTC",
  fill: "zero" as FillMode,
  versionCursor: "v2",
};

const computeSingleCacheKey = () => {
  const raw = `${singleKey.userId}|${singleKey.metricId}|${singleKey.bucketIso}|${singleKey.startISO}|${singleKey.endISO}|${singleKey.tz}|${singleKey.fill}`;
  const hash = crypto
    .createHash("sha1")
    .update(raw)
    .digest("base64url")
    .slice(0, 16);
  return `viz:${singleKey.userId}:${singleKey.metricId}:${singleKey.bucketIso}:${hash}`;
};

const computeDashCacheKey = () => {
  const raw = `${dashKey.userId}|${dashKey.metricIds.join(",")}|${dashKey.bucketIso}|${dashKey.startISO}|${dashKey.endISO}|${dashKey.tz}|${dashKey.fill}|${dashKey.versionCursor ?? ""}`;
  const hash = crypto
    .createHash("sha1")
    .update(raw)
    .digest("base64url")
    .slice(0, 16);
  return `vizdash:${dashKey.userId}:${dashKey.bucketIso}:${hash}`;
};

describe("VisualizationCacheRedis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.isOpen = true;
    redisClient.get.mockResolvedValue(null);
  });

  describe("single visualization cache", () => {
    it("returns null when redis is closed", async () => {
      redisClient.isOpen = false;

      expect(await cache.getSingleVisualization(singleKey)).toBeNull();
      await cache.setSingleVisualization(singleKey, sampleVizPayload());

      expect(redisClient.get).not.toHaveBeenCalled();
      expect(redisClient.set).not.toHaveBeenCalled();
    });

    it("reads cached payload using deterministic key", async () => {
      const payload = { cached: true };
      redisClient.get.mockResolvedValueOnce(JSON.stringify(payload));

      const result = await cache.getSingleVisualization(singleKey);

      expect(result).toEqual(payload);
      expect(redisClient.get).toHaveBeenCalledWith(computeSingleCacheKey());
    });

    it("writes payload with TTL", async () => {
      await cache.setSingleVisualization(singleKey, sampleVizPayload());

      expect(redisClient.set).toHaveBeenCalledWith(
        computeSingleCacheKey(),
        JSON.stringify(sampleVizPayload()),
        { EX: 120 },
      );
    });
  });

  describe("dashboard visualization cache", () => {
    it("returns null when redis is closed", async () => {
      redisClient.isOpen = false;

      expect(await cache.getDashboardVisualization(dashKey)).toBeNull();
      await cache.setDashboardVisualization(dashKey, sampleDashboardPayload());
      expect(redisClient.get).not.toHaveBeenCalled();
    });

    it("reads cached dashboard payloads", async () => {
      const payload = [{ metricId: "metric-2" }];
      redisClient.get.mockResolvedValueOnce(JSON.stringify(payload));

      const result = await cache.getDashboardVisualization(dashKey);

      expect(result).toEqual(payload);
      expect(redisClient.get).toHaveBeenCalledWith(computeDashCacheKey());
    });

    it("writes dashboard payloads with TTL", async () => {
      await cache.setDashboardVisualization(dashKey, sampleDashboardPayload());

      expect(redisClient.set).toHaveBeenCalledWith(
        computeDashCacheKey(),
        JSON.stringify(sampleDashboardPayload()),
        { EX: 120 },
      );
    });
  });
});
const sampleVizPayload = (): VizResponse => ({
  metricId: singleKey.metricId,
  series: [],
  stats: { average: null, min: null, max: null, count: 0 },
  meta: {
    metricId: singleKey.metricId,
    unit: "unit",
    bucket: singleKey.bucket,
    tz: singleKey.tz,
    range: { startISO: singleKey.startISO, endISO: singleKey.endISO },
    fill: singleKey.fill,
  },
});

const sampleDashboardPayload = (): DashboardVizResponse => ({
  items: [
    {
      metricId: "metric-2",
      name: "Metric 2",
      unit: "unit",
      category_name: null,
      category_icon: null,
      category_color: null,
      priority: null,
      series: [],
      stats: { average: null, min: null, max: null, count: 0 },
      lastLogAt: null,
      firstLogAt: null,
      totalLogs: 0,
      latestValue: null,
      latestBucketStart: null,
      requestedRange: {
        startISO: dashKey.startISO,
        endISO: dashKey.endISO,
        bucket: dashKey.bucket,
      },
      actualRange: {
        startISO: dashKey.startISO,
        endISO: dashKey.endISO,
        bucket: dashKey.bucket,
      },
      fallbackRangeUsed: false,
      fallbackStrategy: null,
    },
  ],
  meta: {
    bucket: dashKey.bucket,
    tz: dashKey.tz,
    range: { startISO: dashKey.startISO, endISO: dashKey.endISO },
    count: 1,
    totalMetrics: 1,
    fallbackMetrics: 0,
  },
  sync: { etagSeed: "seed" },
});
