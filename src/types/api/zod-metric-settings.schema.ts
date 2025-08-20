import { z } from "zod";
import {
  zUUID,
  zDateOptional,
  zGoalValue,
  zGoalType,
  zAlertThresholds,
  zDisplayOptions,
} from "@/constants/zod/zod-rules";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/** ===== Base pieces ===== */
export const settingsParams = z.object({ id: zUUID });

/** Base object (no effects) */
const settingsBodyBase = z.object({
  metricId: zUUID,
  goalEnabled: z.boolean().optional().default(false),
  goalType: zGoalType,
  goalValue: zGoalValue,
  timeFrameEnabled: z.boolean().optional().default(false),
  startDate: zDateOptional.optional().nullable(),
  deadlineDate: zDateOptional.optional().nullable(),
  alertEnabled: z.boolean().optional().default(false),
  alertThresholds: zAlertThresholds,
  displayOptions: zDisplayOptions,
});

/** Create: apply strict refinements on the full object */
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

/** Update: partial fields allowed (PATCH semantics on your PUT).
 * Keep validations “presence-aware” so you can send only what you change.
 */
export const settingsBodyPartial = settingsBodyBase
  .partial()
  .superRefine((data, ctx) => {
    // Only enforce if the triggering flag is present *and* true
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

export const listSettingsQuery = z.object({
  metricId: zUUID.optional(),
});

/** ===== SchemaBags for validate(...) ===== */
export const createMetricSettingsSchema = { body: settingsBody };
export const updateMetricSettingsSchema = {
  params: settingsParams,
  body: settingsBodyPartial,
};
export const getMetricSettingsSchema = { params: settingsParams };
export const getAllMetricSettingsSchema = { query: listSettingsQuery };
export const deleteMetricSettingsSchema = { params: settingsParams };
