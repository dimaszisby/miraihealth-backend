export type Granularity = "hour" | "day" | "week" | "month" | "year";
export type BucketAlias = "1h" | "1d" | "1w" | "1m" | "1y";
export type DurationISO = "PT1H" | "P1D" | "P1W" | "P1M" | "P1Y";

export type BucketSpec = {
  unit: Granularity; // canonical grain for SQL/date_trunc
  iso: DurationISO; // canonical key for cache/ETag
  interval: string; // SQL interval literal, e.g. '1 hour'
  trunc: Granularity; // date_trunc arg
  approxMs: number; // for preflight count check
};

const MAP: Record<BucketAlias, BucketSpec> = {
  "1h": {
    unit: "hour",
    iso: "PT1H",
    interval: "1 hour",
    trunc: "hour",
    approxMs: 3_600_000,
  },
  "1d": {
    unit: "day",
    iso: "P1D",
    interval: "1 day",
    trunc: "day",
    approxMs: 86_400_000,
  },
  "1w": {
    unit: "week",
    iso: "P1W",
    interval: "1 week",
    trunc: "week",
    approxMs: 604_800_000,
  },
  "1m": {
    unit: "month",
    iso: "P1M",
    interval: "1 month",
    trunc: "month",
    approxMs: 2_629_746_000,
  }, // ~30.44d
  "1y": {
    unit: "year",
    iso: "P1Y",
    interval: "1 year",
    trunc: "year",
    approxMs: 31_556_952_000,
  }, // ~365.24d
};

export function resolveBucket(b?: BucketAlias): BucketSpec {
  return MAP[b ?? "1d"];
}
