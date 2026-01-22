import { z } from "zod";

const DEFAULT_TZ = process.env.DEFAULT_TZ ?? "Asia/Jakarta";
const BucketEnum = z.enum(["1h", "1d", "1w", "1m", "1y"]);
const FillEnum = z.enum(["none", "zero", "nan"]);

const tzSchema = z
  .string()
  .default(DEFAULT_TZ)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Invalid IANA time zone");

const BUCKET_ANCHOR_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
};

const AbsoluteRange = z
  .object({
    start: z.string().datetime("Invalid start date format"),
    end: z.string().datetime("Invalid end date format"),
  })
  .superRefine(({ start, end }, ctx) => {
    const s = Date.parse(start);
    const e = Date.parse(end);
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end"],
        message: "end must be after start",
      });
    }
  });

const RelativeRange = z.object({
  last: z
    .string()
    .regex(/^\d+(h|d|w|m|y)$/, "Use format like 7d, 30d, 12m, 1y"),
});

function anchorNow(bucket?: string) {
  const unitMs = BUCKET_ANCHOR_MS[bucket ?? ""] ?? 60 * 1000; // default minute
  const anchored = Math.floor(Date.now() / unitMs) * unitMs;
  return new Date(anchored);
}

function computeStartEndFromLast(last: string, bucket?: string) {
  const end = anchorNow(bucket);
  const n = parseInt(last.slice(0, -1), 10);
  const u = last.slice(-1);
  const start = new Date(end);
  switch (u) {
    case "h":
      start.setHours(end.getHours() - n);
      break;
    case "d":
      start.setDate(end.getDate() - n);
      break;
    case "w":
      start.setDate(end.getDate() - 7 * n);
      break;
    case "m":
      start.setMonth(end.getMonth() - n);
      break;
    case "y":
      start.setFullYear(end.getFullYear() - n);
      break;
  }
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export const getVisualizationSchema = z
  .object({
    params: z.object({ metricId: z.string().uuid("Invalid metric ID format") }),
    query: z
      .object({
        bucket: BucketEnum.default("1d"),
        tz: tzSchema,
        fill: FillEnum.default("none"),
      })
      .and(z.union([AbsoluteRange, RelativeRange])),
  })
  .transform(({ params, query }) => {
    if ("last" in query) {
      const { startISO, endISO } = computeStartEndFromLast(
        query.last,
        query.bucket,
      );
      return { params, query: { ...query, start: startISO, end: endISO } };
    }

    return { params, query };
  });

export const getDashboardVizSchema = z
  .object({
    query: z
      .object({
        bucket: BucketEnum.default("1d"),
        tz: tzSchema,
        fill: FillEnum.default("none"),
        limit: z.coerce.number().int().positive().max(48).default(12),
      })
      .and(z.union([AbsoluteRange, RelativeRange])),
  })
  .transform(({ query }) => {
    if ("last" in query) {
      const { startISO, endISO } = computeStartEndFromLast(
        query.last,
        query.bucket,
      );
      return { query: { ...query, start: startISO, end: endISO } };
    }
    return { query };
  });
