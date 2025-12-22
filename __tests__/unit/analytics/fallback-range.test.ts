import { computeFallbackRange } from "@/features/analytics/domain/fallback-range";

describe("computeFallbackRange", () => {
  const requested = {
    startISO: "2024-01-01T00:00:00.000Z",
    endISO: "2024-01-31T00:00:00.000Z",
    bucket: "1d" as const,
  };

  it("returns null when no last log timestamp exists", () => {
    const result = computeFallbackRange({
      requested,
      lastLogAt: null,
      guardBuckets: 400,
    });
    expect(result).toBeNull();
  });

  it("coarsens buckets when the guard would be exceeded", () => {
    const result = computeFallbackRange({
      requested: { ...requested, bucket: "1h" },
      lastLogAt: "2024-02-01T00:00:00.000Z",
      guardBuckets: 48,
    });

    expect(result).not.toBeNull();
    expect(result?.bucketAlias).toBe("1d");
    expect(result?.range.endISO).toBe("2024-02-01T00:00:00.000Z");
    expect(result?.estimatedBuckets).toBeLessThanOrEqual(48);
    expect(result?.coarsenedBucket).toBe(true);
  });

  it("clamps the fallback window when range still exceeds guard limit", () => {
    const result = computeFallbackRange({
      requested,
      lastLogAt: "2024-08-01T00:00:00.000Z",
      guardBuckets: 5,
    });

    expect(result).not.toBeNull();
    expect(result?.estimatedBuckets).toBeLessThanOrEqual(5);
    expect(
      new Date(result!.range.endISO).getTime() -
        new Date(result!.range.startISO).getTime(),
    ).toBeLessThanOrEqual(5 * 24 * 60 * 60 * 1000 + 1000);
  });
});
