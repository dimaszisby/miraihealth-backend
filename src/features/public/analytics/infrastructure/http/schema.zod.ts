import { z } from "zod";
import { env } from "@/config/envManager.js";
import { resolveBucket } from "../../domain/buckets.js";

const DEFAULT_TZ = env.DEFAULT_TZ;
const BucketEnum = z.enum(["1h", "1d", "1w", "1m", "1y"]);
const FillEnum = z.enum(["none", "zero", "nan"]);
const MAX_BUCKETS = env.VIZ_MAX_BUCKETS;
const MAX_DATE_RANGE_MS = 8_640_000_000_000_000; // JS Date min/max span (~275k years)
const LAST_WINDOW_REGEX = /^[1-9][0-9]*(h|d|w|m|y)$/;
type RelativeUnit = "h" | "d" | "w" | "m" | "y";
const LAST_UNIT_MS: Record<RelativeUnit, number> = {
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  m: 30 * 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
};
const RelativeWindow = z
  .string()
  .regex(LAST_WINDOW_REGEX, "Use format like 7d, 30d, 12m, 1y")
  .optional();

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

function anchorNow(bucket?: string) {
  const unitMs = BUCKET_ANCHOR_MS[bucket ?? ""] ?? 60 * 1000; // default minute
  const anchored = Math.floor(Date.now() / unitMs) * unitMs;
  return new Date(anchored);
}

function parseRelativeWindow(value: string) {
  if (!LAST_WINDOW_REGEX.test(value)) return null;
  const amount = Number(value.slice(0, -1));
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  const unit = value.slice(-1) as RelativeUnit;
  return { amount, unit };
}

function computeStartEndFromLast(last: string, bucket?: string) {
  const end = anchorNow(bucket);
  const parsed = parseRelativeWindow(last);
  if (!parsed) {
    return { startISO: end.toISOString(), endISO: end.toISOString() };
  }
  const { amount, unit } = parsed;
  const start = new Date(end);
  switch (unit) {
    case "h":
      start.setHours(end.getHours() - amount);
      break;
    case "d":
      start.setDate(end.getDate() - amount);
      break;
    case "w":
      start.setDate(end.getDate() - 7 * amount);
      break;
    case "m":
      start.setMonth(end.getMonth() - amount);
      break;
    case "y":
      start.setFullYear(end.getFullYear() - amount);
      break;
  }
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

const validateAbsoluteRange = (
  start: string | undefined,
  end: string | undefined,
  ctx: z.RefinementCtx,
) => {
  if (start && !end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["end"],
      message: "Provide end when start is supplied.",
    });
  }
  if (!start && end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["start"],
      message: "Provide start when end is supplied.",
    });
  }
  if (start && end) {
    const s = Date.parse(start);
    const e = Date.parse(end);
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end"],
        message: "end must be after start",
      });
    }
  }
};

const resolveRange = (
  bucket: z.infer<typeof BucketEnum>,
  start: string | undefined,
  end: string | undefined,
  last: string | undefined,
) => {
  if (start && end) {
    return { startISO: start, endISO: end };
  }
  const resolvedLast = last ?? "30d";
  return computeStartEndFromLast(resolvedLast, bucket);
};

const validateRelativeWindow = (
  bucket: z.infer<typeof BucketEnum>,
  start: string | undefined,
  end: string | undefined,
  last: string | undefined,
  ctx: z.RefinementCtx,
) => {
  if (start && end) return;
  if (!last) return;
  const parsed = parseRelativeWindow(last);
  if (!parsed) return;
  const unitMs = LAST_UNIT_MS[parsed.unit];
  const maxUnits = Math.floor(MAX_DATE_RANGE_MS / unitMs);
  if (parsed.amount > maxUnits) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["last"],
      message: "Relative range is too large.",
    });
    return;
  }
  const windowMs = parsed.amount * unitMs;
  const spec = resolveBucket(bucket);
  const est = Math.ceil(windowMs / spec.approxMs) + 2;
  if (est > MAX_BUCKETS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["last"],
      message: `Range too large for ${spec.iso} (~${est} buckets, max=${MAX_BUCKETS})`,
    });
  }
};

const VisualizationQueryBase = z
  .object({
    bucket: BucketEnum.default("1d"),
    tz: tzSchema,
    fill: FillEnum.default("none"),
    start: z.string().datetime("Invalid start date format").optional(),
    end: z.string().datetime("Invalid end date format").optional(),
    last: RelativeWindow,
  })
  .strict()
  .superRefine((input, ctx) => {
    validateAbsoluteRange(input.start, input.end, ctx);
    if ((input.start || input.end) && input.last) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last"],
        message: "Provide either last or start/end, not both.",
      });
    }
    validateRelativeWindow(
      input.bucket,
      input.start,
      input.end,
      input.last,
      ctx,
    );
  });

const DashboardVisualizationQueryBase = z
  .object({
    bucket: BucketEnum.default("1d"),
    tz: tzSchema,
    fill: FillEnum.default("none"),
    limit: z.coerce.number().int().positive().max(48).default(12),
    start: z.string().datetime("Invalid start date format").optional(),
    end: z.string().datetime("Invalid end date format").optional(),
    last: RelativeWindow,
  })
  .strict()
  .superRefine((input, ctx) => {
    validateAbsoluteRange(input.start, input.end, ctx);
    if ((input.start || input.end) && input.last) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last"],
        message: "Provide either last or start/end, not both.",
      });
    }
    validateRelativeWindow(
      input.bucket,
      input.start,
      input.end,
      input.last,
      ctx,
    );
  });

const VisualizationQuery = VisualizationQueryBase.transform((input) => {
  const { startISO, endISO } = resolveRange(
    input.bucket,
    input.start,
    input.end,
    input.last,
  );
  return {
    bucket: input.bucket,
    tz: input.tz,
    fill: input.fill,
    start: startISO,
    end: endISO,
  };
});

const DashboardVisualizationQuery = DashboardVisualizationQueryBase.transform(
  (input) => {
    const { startISO, endISO } = resolveRange(
      input.bucket,
      input.start,
      input.end,
      input.last,
    );
    return {
      bucket: input.bucket,
      tz: input.tz,
      fill: input.fill,
      limit: input.limit,
      start: startISO,
      end: endISO,
    };
  },
);

export const getVisualizationSchema = z.object({
  params: z.object({ metricId: z.string().uuid("Invalid metric ID format") }),
  query: VisualizationQuery,
});

export const getDashboardVizSchema = z.object({
  query: DashboardVisualizationQuery,
});
