import { jest } from "@jest/globals";
import { MetricSettingsCacheInvalidator } from "@/features/metric-settings/infrastructure/providers/MetricSettingsCacheInvalidator.js";
import * as redis from "@/utils/redis-client.js";
import * as cacheLogging from "@/shared/cache/logging.js";

const setRedisOpen = (value: boolean) => {
  Object.defineProperty(redis.redisClient, "isOpen", {
    configurable: true,
    get: () => value,
  });
};

describe("MetricSettingsCacheInvalidator", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setRedisOpen(true);
  });

  it("returns early when redis is not open", async () => {
    setRedisOpen(false);
    const sut = new MetricSettingsCacheInvalidator();
    const invalidateSpy = jest
      .spyOn(redis, "invalidateCache")
      .mockResolvedValue();

    await sut.invalidate("user-1", "org-1", "metric-1", "settings-1");
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("invalidates all relevant keys and logs result", async () => {
    const sut = new MetricSettingsCacheInvalidator();
    const keySpy = jest.spyOn(redis, "invalidateCache").mockResolvedValue();
    const patternSpy = jest
      .spyOn(redis, "invalidateCacheByPattern")
      .mockResolvedValue();
    const logSpy = jest
      .spyOn(cacheLogging, "logCacheInvalidation")
      .mockImplementation(() => undefined);
    const logErrorSpy = jest
      .spyOn(cacheLogging, "logCacheInvalidationError")
      .mockImplementation(() => undefined);

    await sut.invalidate("user-1", "org-1", "metric-1", "settings-1");

    expect(keySpy).toHaveBeenCalledTimes(2);
    expect(patternSpy).toHaveBeenCalledWith("metricSettings:org-1:user-1:*");
    expect(keySpy).toHaveBeenNthCalledWith(
      1,
      "metricSettings:org-1:user-1:metric-1",
    );
    expect(keySpy).toHaveBeenNthCalledWith(
      2,
      "metricSetting:org-1:user-1:settings-1",
    );
    expect(logSpy).toHaveBeenCalledWith("metric-settings-cache", {
      userId: "user-1",
      organizationId: "org-1",
      metricId: "metric-1",
      settingsId: "settings-1",
    });
    expect(logErrorSpy).not.toHaveBeenCalled();
  });
});
