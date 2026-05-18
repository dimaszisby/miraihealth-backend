import { jest } from "@jest/globals";
import {
  checkLockout,
  recordFailedAttempt,
  resetLockout,
  LOCKOUT_THRESHOLD,
  LOCKOUT_TTL_SECONDS,
  type LockoutRedisClient,
} from "@/features/auth/infrastructure/http/loginLockout.js";
import AppError from "@/utils/AppError.js";

type MockRedis = jest.Mocked<LockoutRedisClient> & { isOpen: boolean };

const buildRedis = (overrides: Partial<MockRedis> = {}): MockRedis => {
  const client = {
    isOpen: true,
    get: jest.fn<LockoutRedisClient["get"]>(),
    incr: jest.fn<LockoutRedisClient["incr"]>(),
    expire: jest.fn<LockoutRedisClient["expire"]>(),
    del: jest.fn<LockoutRedisClient["del"]>(),
    ...overrides,
  } as MockRedis;
  return client;
};

describe("loginLockout", () => {
  const email = "victim@example.com";

  describe("checkLockout", () => {
    it("passes when counter is under threshold", async () => {
      const redis = buildRedis();
      redis.get.mockResolvedValue("3");
      await expect(checkLockout(email, redis)).resolves.toBeUndefined();
      expect(redis.get).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:lockout:[a-f0-9]{64}$/),
      );
    });

    it("passes when counter is missing", async () => {
      const redis = buildRedis();
      redis.get.mockResolvedValue(null);
      await expect(checkLockout(email, redis)).resolves.toBeUndefined();
    });

    it("throws 429 AppError when counter is at threshold", async () => {
      const redis = buildRedis();
      redis.get.mockResolvedValue(String(LOCKOUT_THRESHOLD));
      await expect(checkLockout(email, redis)).rejects.toMatchObject({
        statusCode: 429,
      });
      const err = await checkLockout(email, redis).catch((e) => e);
      expect(err).toBeInstanceOf(AppError);
    });

    it("throws 429 AppError when counter is above threshold", async () => {
      const redis = buildRedis();
      redis.get.mockResolvedValue(String(LOCKOUT_THRESHOLD + 3));
      await expect(checkLockout(email, redis)).rejects.toMatchObject({
        statusCode: 429,
      });
    });

    it("fails open when redis is closed", async () => {
      const redis = buildRedis({ isOpen: false });
      await expect(checkLockout(email, redis)).resolves.toBeUndefined();
      expect(redis.get).not.toHaveBeenCalled();
    });

    it("fails open when redis throws", async () => {
      const redis = buildRedis();
      redis.get.mockRejectedValue(new Error("ECONNREFUSED"));
      await expect(checkLockout(email, redis)).resolves.toBeUndefined();
    });

    it("uses sha256 hash of the lowercased trimmed email as the key", async () => {
      const redis = buildRedis();
      redis.get.mockResolvedValue("0");
      await checkLockout("  Victim@Example.COM  ", redis);
      const sameEmailRedis = buildRedis();
      sameEmailRedis.get.mockResolvedValue("0");
      await checkLockout("victim@example.com", sameEmailRedis);
      expect(redis.get.mock.calls[0][0]).toBe(
        sameEmailRedis.get.mock.calls[0][0],
      );
    });
  });

  describe("recordFailedAttempt", () => {
    it("increments counter and sets TTL", async () => {
      const redis = buildRedis();
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(true);
      await recordFailedAttempt(email, redis);
      expect(redis.incr).toHaveBeenCalledTimes(1);
      expect(redis.expire).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:lockout:/),
        LOCKOUT_TTL_SECONDS,
      );
    });

    it("does nothing when redis is closed", async () => {
      const redis = buildRedis({ isOpen: false });
      await recordFailedAttempt(email, redis);
      expect(redis.incr).not.toHaveBeenCalled();
      expect(redis.expire).not.toHaveBeenCalled();
    });

    it("fails open when redis throws", async () => {
      const redis = buildRedis();
      redis.incr.mockRejectedValue(new Error("ECONNREFUSED"));
      await expect(recordFailedAttempt(email, redis)).resolves.toBeUndefined();
    });
  });

  describe("resetLockout", () => {
    it("deletes the counter key", async () => {
      const redis = buildRedis();
      redis.del.mockResolvedValue(1);
      await resetLockout(email, redis);
      expect(redis.del).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:lockout:[a-f0-9]{64}$/),
      );
    });

    it("does nothing when redis is closed", async () => {
      const redis = buildRedis({ isOpen: false });
      await resetLockout(email, redis);
      expect(redis.del).not.toHaveBeenCalled();
    });

    it("fails open when redis throws", async () => {
      const redis = buildRedis();
      redis.del.mockRejectedValue(new Error("ECONNREFUSED"));
      await expect(resetLockout(email, redis)).resolves.toBeUndefined();
    });
  });

  describe("end-to-end with a faux Redis", () => {
    const makeFauxRedis = (): MockRedis => {
      const store = new Map<string, number>();
      const redis = {
        isOpen: true,
        get: jest.fn(async (key: string) =>
          store.has(key) ? String(store.get(key)) : null,
        ),
        incr: jest.fn(async (key: string) => {
          const next = (store.get(key) ?? 0) + 1;
          store.set(key, next);
          return next;
        }),
        expire: jest.fn(async () => true),
        del: jest.fn(async (key: string | string[]) => {
          const keys = Array.isArray(key) ? key : [key];
          let n = 0;
          for (const k of keys) if (store.delete(k)) n += 1;
          return n;
        }),
      } as MockRedis;
      return redis;
    };

    it("locks after threshold failures, then unlocks on reset", async () => {
      const redis = makeFauxRedis();

      for (let i = 0; i < LOCKOUT_THRESHOLD; i += 1) {
        await expect(checkLockout(email, redis)).resolves.toBeUndefined();
        await recordFailedAttempt(email, redis);
      }

      await expect(checkLockout(email, redis)).rejects.toMatchObject({
        statusCode: 429,
      });

      await resetLockout(email, redis);

      await expect(checkLockout(email, redis)).resolves.toBeUndefined();
    });
  });
});
