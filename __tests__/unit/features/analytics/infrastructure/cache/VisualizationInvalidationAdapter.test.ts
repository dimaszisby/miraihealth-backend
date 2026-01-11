import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AnalyticsVisualizationInvalidationAdapter } from "@/features/analytics/infrastructure/cache/VisualizationInvalidationAdapter.js";

const scanIteratorMock = jest.fn();
const delMock = jest.fn();

jest.mock("@/utils/redis-client.js", () => ({
  redisClient: {
    isOpen: true,
    scanIterator: (...args: unknown[]) => scanIteratorMock(...args),
    del: (...args: unknown[]) => delMock(...args),
  },
}));

const { redisClient } = jest.requireMock("@/utils/redis-client.js") as {
  redisClient: { isOpen: boolean };
};

const makeIterator = (keys: string[]) => ({
  async *[Symbol.asyncIterator]() {
    for (const key of keys) {
      yield key;
    }
  },
});

const adapter = new AnalyticsVisualizationInvalidationAdapter();

describe("AnalyticsVisualizationInvalidationAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.isOpen = true;
  });

  it("skips invalidation when redis is not open", async () => {
    redisClient.isOpen = false;

    await adapter.invalidateByMetric("user-1", "metric-9");

    expect(scanIteratorMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
  });

  it("scans singular and dashboard namespaces and deletes each key", async () => {
    scanIteratorMock
      .mockReturnValueOnce(makeIterator(["viz:user-1:metric-9:detail"]))
      .mockReturnValueOnce(
        makeIterator(["vizdash:user-1:default", "vizdash:user-1:summary"]),
      );

    await adapter.invalidateByMetric("user-1", "metric-9");

    expect(scanIteratorMock).toHaveBeenNthCalledWith(1, {
      MATCH: "viz:user-1:metric-9:*",
      COUNT: 200,
    });
    expect(scanIteratorMock).toHaveBeenNthCalledWith(2, {
      MATCH: "vizdash:user-1:*",
      COUNT: 200,
    });

    expect(delMock).toHaveBeenCalledTimes(3);
    expect(delMock).toHaveBeenCalledWith("viz:user-1:metric-9:detail");
    expect(delMock).toHaveBeenCalledWith("vizdash:user-1:default");
    expect(delMock).toHaveBeenCalledWith("vizdash:user-1:summary");
  });
});
