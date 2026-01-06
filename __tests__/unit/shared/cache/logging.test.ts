import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  logCacheInvalidation,
  logCacheInvalidationError,
} from "@/shared/cache/logging.js";

jest.mock("@/utils/logger.js", () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

const loggerMock = jest.requireMock("@/utils/logger.js") as {
  debug: jest.Mock;
  error: jest.Mock;
};

describe("shared/cache/logging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs cache invalidation context", () => {
    logCacheInvalidation("metric-cache", { userId: "user-1", metricId: "m-1" });

    expect(loggerMock.debug).toHaveBeenCalledWith("[CACHE] invalidate", {
      scope: "metric-cache",
      userId: "user-1",
      metricId: "m-1",
    });
  });

  it("logs invalidation errors with normalized Error payloads", () => {
    const err = new Error("boom");

    logCacheInvalidationError("metric-cache", err, {
      userId: "user-1",
    });

    expect(loggerMock.error).toHaveBeenCalledWith(
      "[CACHE] invalidate failed",
      expect.objectContaining({
        scope: "metric-cache",
        error: "boom",
        stack: err.stack,
        userId: "user-1",
      }),
    );
  });

  it("logs invalidation errors with primitive payloads without stack traces", () => {
    logCacheInvalidationError("metric-cache", "boom");

    expect(loggerMock.error).toHaveBeenCalledWith("[CACHE] invalidate failed", {
      scope: "metric-cache",
      error: "boom",
    });
  });
});
