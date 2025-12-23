import { z } from "zod";
import {
  zUUID,
  zDateOptional,
  zGoalValue,
  zGoalType,
  zAlertThresholds,
  zDisplayOptions,
} from "@/constants/zod/zod-rules.js";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const settingsParams = z.object({ id: zUUID });

const settingsBodyBase = z.object({
  metricId: zUUID,
  goalEnabled: z.boolean().optional().default(false),
  goalType: zGoalType,
  goalValue: zGoalValue,
  timeFrameEnabled: z.boolean().optional().default(false),
  startDate: zDateOptional.optional().nullable(),
  deadlineDate: zDateOptional.optional().nullable(),
  alertEnabled: z.boolean().optional().default(false),
  alertThresholds: zAlertThresholds.nullable(),
  displayOptions: zDisplayOptions,
});

export const settingsBody = settingsBodyBase
  .superRefine((data, ctx) => {
    if (data.goalEnabled) {
      if (data.goalType == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "goalType is required when goalEnabled is true.",
          path: ["goalType"],
        });
      }
      if (data.goalValue == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "goalValue is required when goalEnabled is true.",
          path: ["goalValue"],
        });
      }
    }
  })
  .superRefine((data, ctx) => {
    if (data.timeFrameEnabled) {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "startDate is required when timeFrameEnabled is true.",
          path: ["startDate"],
        });
      }
      if (!data.deadlineDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "deadlineDate is required when timeFrameEnabled is true.",
          path: ["deadlineDate"],
        });
      }
      if (
        data.startDate &&
        data.deadlineDate &&
        data.deadlineDate <= data.startDate
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "deadlineDate must be after startDate.",
          path: ["deadlineDate"],
        });
      }
    }
  });

export const settingsBodyPartial = settingsBodyBase
  .partial()
  .superRefine((data, ctx) => {
    if (data.goalEnabled === true) {
      if (data.goalType == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Include goalType when enabling goal (goalEnabled=true) in this request.",
          path: ["goalType"],
        });
      }
      if (data.goalValue == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Include goalValue when enabling goal (goalEnabled=true) in this request.",
          path: ["goalValue"],
        });
      }
    }
  })
  .superRefine((data, ctx) => {
    if (data.timeFrameEnabled === true) {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Include startDate when enabling time frame (timeFrameEnabled=true) in this request.",
          path: ["startDate"],
        });
      }
      if (!data.deadlineDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Include deadlineDate when enabling time frame (timeFrameEnabled=true) in this request.",
          path: ["deadlineDate"],
        });
      }
      if (
        data.startDate &&
        data.deadlineDate &&
        data.deadlineDate <= data.startDate
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "deadlineDate must be after startDate.",
          path: ["deadlineDate"],
        });
      }
    }
  });

const MetricSettingsFilterSchema = z.object({
  ["filter[metricId]"]: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    zUUID.optional()
  ),
  ["filter[isActive]"]: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.boolean().optional()
  ),
  filter: z
    .object({
      metricId: zUUID.optional(),
      isActive: z.coerce.boolean().optional(),
    })
    .partial()
    .optional(),
});

export const createMetricSettingsSchema = z.object({ body: settingsBody });
export const updateMetricSettingsSchema = z.object({
  params: settingsParams,
  body: settingsBodyPartial,
});

export const getMetricSettingsSchema = z.object({ params: settingsParams });
export const deleteMetricSettingsSchema = z.object({ params: settingsParams });

const listMetricSettingsViaCursorQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum(["createdAt", "-createdAt", "updatedAt", "-updatedAt", "isActive", "-isActive"] as const)
      .default("-createdAt"),
    q: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(1).optional()
    ),
    after: z.string().optional(),
    includeTotal: z.coerce.boolean().default(false),
  })
  .and(MetricSettingsFilterSchema)
  .transform((value) => {
    const metricId = value["filter[metricId]"] ?? value.filter?.metricId;
    const isActive = value["filter[isActive]"] ?? value.filter?.isActive;

    const filter: { metricId?: string; isActive?: boolean } = {};
    if (metricId) filter.metricId = metricId;
    if (typeof isActive === "boolean") filter.isActive = isActive;

    return {
      limit: value.limit,
      sort: value.sort,
      q: value.q,
      after: value.after,
      includeTotal: value.includeTotal,
      filter: Object.keys(filter).length ? filter : undefined,
    };
  });

export const listMetricSettingsViaCursorSchema = z.object({
  query: listMetricSettingsViaCursorQuery,
});

export const updateDisplayOptionsSchema = z.object({
  params: settingsParams,
  body: z.object({
    displayOptions: zDisplayOptions,
  }),
});

export const goalAchievementSchema = { params: settingsParams };
