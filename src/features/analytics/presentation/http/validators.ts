import { z } from "zod";

const DEFAULT_TZ = process.env.DEFAULT_TZ ?? "Asia/Jakarta";
const BucketEnum = z.enum(["1h", "1d", "1w", "1m", "1y"]);
const FillEnum = z.enum(["none", "zero", "nan"]);

// * Helpers
// IANA TZ validation (works on modern Node); falls back to try/catch if needed.
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

// Normalize: relative range into concrete ISO strings
function computeStartEndFromLast(last: string) {
  const now = new Date();
  const end = now;
  const n = parseInt(last.slice(0, -1), 10);
  const u = last.slice(-1);
  const start = new Date(now);
  switch (u) {
    case "h":
      start.setHours(now.getHours() - n);
      break;
    case "d":
      start.setDate(now.getDate() - n);
      break;
    case "w":
      start.setDate(now.getDate() - 7 * n);
      break;
    case "m":
      start.setMonth(now.getMonth() - n);
      break;
    case "y":
      start.setFullYear(now.getFullYear() - n);
      break;
  }
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

// * Schemas
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
      const { startISO, endISO } = computeStartEndFromLast(query.last);
      return { params, query: { ...query, start: startISO, end: endISO } };
    }

    return { params, query }; // validated absolute path
  });
