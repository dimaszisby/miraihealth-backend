import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  disconnectRedis,
  invalidateCache,
  invalidateCacheByPattern,
} from "@/utils/redis-client.js";

type AsyncFn<T = void, Args extends any[] = any[]> = (
  ...args: Args
) => Promise<T>;
type AsyncMock<T = void, Args extends any[] = any[]> = jest.MockedFunction<
  AsyncFn<T, Args>
>;
type MockRedisClient = {
  isOpen: boolean;
  on: jest.Mock;
  connect: AsyncMock<void, []>;
  quit: AsyncMock<void, []>;
  del: AsyncMock<void, [string | string[]]>;
  scan: AsyncMock<{ cursor: number; keys: string[] }, [number, unknown]>;
};

// Swap the real redis client with an in-memory mock so we control connection state + cursor responses.
jest.mock("redis", () => {
  const mockRedisClient: MockRedisClient = {
    isOpen: false,
    on: jest.fn(),
    connect: jest.fn() as AsyncMock<void, []>,
    quit: jest.fn() as AsyncMock<void, []>,
    del: jest.fn() as AsyncMock<void, [string | string[]]>,
    scan: jest.fn() as AsyncMock<
      { cursor: number; keys: string[] },
      [number, unknown]
    >,
  };

  mockRedisClient.connect.mockResolvedValue(undefined);
  mockRedisClient.quit.mockResolvedValue(undefined);
  mockRedisClient.del.mockResolvedValue(undefined);
  mockRedisClient.scan.mockResolvedValue({
    cursor: 0,
    keys: [] as string[],
  });

  return {
    createClient: () => mockRedisClient,
    __mockClient: mockRedisClient,
  };
});

const { __mockClient: mockRedisClient } = jest.requireMock("redis") as {
  __mockClient: MockRedisClient;
};

jest.mock("@/config/envManager.js", () => ({
  env: {
    NODE_ENV: "test",
    REDIS_HOST: "127.0.0.1",
    REDIS_PORT: "6379",
    REDIS_PASSWORD: undefined,
    REDIS_REQUIRED: false,
    ENABLE_REDIS_INTEGRATION: false,
  },
}));

const { env: envMock } = jest.requireMock("@/config/envManager.js") as {
  env: {
    NODE_ENV: string;
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD?: string;
    REDIS_REQUIRED: boolean;
    ENABLE_REDIS_INTEGRATION: boolean;
  };
};

// Silence logger output during tests and let assertions capture the payloads instead.
jest.mock("@/utils/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const loggerMock = jest.requireMock("@/utils/logger.js") as {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
};

describe("redis-client utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.isOpen = true;
    mockRedisClient.scan.mockResolvedValue({
      cursor: 0,
      keys: [] as string[],
    });
  });

  describe("invalidateCache", () => {
    it("skips deletion when redis is closed", async () => {
      mockRedisClient.isOpen = false;

      await invalidateCache("metrics:user-1");

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it("deletes cache keys and logs when redis is open", async () => {
      await invalidateCache("metrics:user-1");

      expect(mockRedisClient.del).toHaveBeenCalledWith("metrics:user-1");
      expect(loggerMock.info).toHaveBeenCalledWith(
        "♻️ Cache invalidated for metrics:user-1",
      );
    });
  });

  describe("invalidateCacheByPattern", () => {
    it("skips scanning when redis is closed", async () => {
      mockRedisClient.isOpen = false;

      await invalidateCacheByPattern("metrics:user-1:*");

      expect(mockRedisClient.scan).not.toHaveBeenCalled();
    });

    it("scans through keys and deletes matches", async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce({ cursor: 1, keys: ["k1", "k2"] })
        .mockResolvedValueOnce({ cursor: 0, keys: [] as string[] });

      await invalidateCacheByPattern("metrics:user-1:*");

      expect(mockRedisClient.scan).toHaveBeenNthCalledWith(1, 0, {
        MATCH: "metrics:user-1:*",
        COUNT: 100,
      });
      expect(mockRedisClient.scan).toHaveBeenNthCalledWith(2, 1, {
        MATCH: "metrics:user-1:*",
        COUNT: 100,
      });
      expect(mockRedisClient.del).toHaveBeenCalledWith(["k1", "k2"]);
      expect(loggerMock.info).toHaveBeenCalledWith(
        '[CACHE] Pattern "metrics:user-1:*" deleted keys:',
        ["k1", "k2"],
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        '[CACHE] Pattern "metrics:user-1:*" found NO keys to delete.',
      );
    });
  });

  describe("disconnectRedis", () => {
    it("logs and skips quit when redis already closed", async () => {
      mockRedisClient.isOpen = false;

      await disconnectRedis();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith(
        "[PROCESS] Redis client already closed.",
      );
    });

    it("quits connection when redis is open", async () => {
      mockRedisClient.isOpen = true;

      await disconnectRedis();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith(
        "[PROCESS] Redis client disconnected.",
      );
    });
  });
});
