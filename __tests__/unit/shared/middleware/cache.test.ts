import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import type { Response } from "express";
import { cacheMiddleware } from "@/shared/middleware/cache.js";
import type { AuthRequest } from "@/types/request.context.js";

jest.mock("@/config/envManager.js", () => ({
  env: { NODE_ENV: "production" },
}));

const { env: envMock } = jest.requireMock("@/config/envManager.js") as {
  env: { NODE_ENV: string };
};

jest.mock("@/utils/redis-client.js", () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
  },
}));

const { redisClient } = jest.requireMock("@/utils/redis-client.js") as {
  redisClient: {
    get: jest.MockedFunction<(key: string) => Promise<string | null>>;
    setEx: jest.MockedFunction<
      (key: string, ttl: number, payload: string) => Promise<void>
    >;
  };
};

jest.mock("@/utils/logger.js", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const loggerMock = jest.requireMock("@/utils/logger.js") as Record<
  "info" | "error",
  jest.Mock
>;

type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
  originalJson: jest.Mock;
};

const createResponse = (): MockResponse => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    originalJson: jest.fn(),
  } as unknown as MockResponse;
  res.originalJson = res.json;
  res.status.mockReturnValue(res);
  return res;
};

describe("cacheMiddleware", () => {
  const ttl = 60;
  const request = { user: { id: "user-42" } } as Partial<AuthRequest>;
  const keyGenerator = jest
    .fn<(req: AuthRequest) => string>()
    .mockImplementation((req) => `cache:${req.user?.id}`);
  const createCachingMiddleware = () =>
    cacheMiddleware(keyGenerator, ttl, { disableInTest: false });

  beforeEach(() => {
    jest.clearAllMocks();
    envMock.NODE_ENV = "production";
    redisClient.get.mockResolvedValue(null);
    redisClient.setEx.mockResolvedValue();
  });

  it("short-circuits in test environments", async () => {
    envMock.NODE_ENV = "test";
    const next = jest.fn();
    const res = createResponse();

    await cacheMiddleware(keyGenerator, ttl)(request as AuthRequest, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(redisClient.get).not.toHaveBeenCalled();
  });

  it("responds with cached payload when present", async () => {
    const next = jest.fn();
    const res = createResponse();
    const payload = { hello: "cached" };
    redisClient.get.mockResolvedValueOnce(JSON.stringify(payload));

    await createCachingMiddleware()(request as AuthRequest, res, next);

    expect(redisClient.get).toHaveBeenCalledWith("cache:user-42");
    expect(loggerMock.info).toHaveBeenCalledWith(
      "[CACHE PROCESS] Cache HIT: cache:user-42",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
    expect(next).not.toHaveBeenCalled();
  });

  it("delegates downstream and stores payload on cache miss", async () => {
    const next = jest.fn();
    const res = createResponse();
    const middleware = createCachingMiddleware();
    const responseBody = { data: "fresh" };

    await middleware(request as AuthRequest, res, next);

    expect(loggerMock.info).toHaveBeenCalledWith(
      "[CACHE PROCESS] Cache miss for key: cache:user-42",
    );
    expect(next).toHaveBeenCalledTimes(1);

    await res.json(responseBody);
    await Promise.resolve();

    expect(redisClient.setEx).toHaveBeenCalledWith(
      "cache:user-42",
      ttl,
      JSON.stringify(responseBody),
    );
    expect(res.originalJson).toHaveBeenCalledWith(responseBody);
    expect(loggerMock.info).toHaveBeenCalledWith(
      "[CACHE] Cached response: cache:user-42 (TTL: 60s)",
    );
  });

  it("logs cache write failures but still resolves response", async () => {
    const next = jest.fn();
    const res = createResponse();
    const writeError = new Error("boom");
    redisClient.setEx.mockRejectedValueOnce(writeError);

    await createCachingMiddleware()(request as AuthRequest, res, next);
    await res.json({ data: "value" });
    await Promise.resolve();

    expect(loggerMock.error).toHaveBeenCalledWith(
      "[CACHE ERROR] Cache write failed: cache:user-42",
      writeError,
    );
    expect(res.originalJson).toHaveBeenCalledWith({ data: "value" });
  });

  it("logs and calls next when cache read throws", async () => {
    const next = jest.fn();
    const res = createResponse();
    const readError = new Error("redis down");
    redisClient.get.mockRejectedValueOnce(readError);

    await createCachingMiddleware()(request as AuthRequest, res, next);

    expect(loggerMock.error).toHaveBeenCalledWith(
      "[CACHE ERROR] Cache middleware error:",
      readError,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
