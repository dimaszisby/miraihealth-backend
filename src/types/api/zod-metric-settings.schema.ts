// src/types/api/zod-metric-settings.schema.ts

import { z } from "zod";
import {
  zUUID,
  zDateOptional,
  zGoalValue,
  zGoalType,
  zAlertThresholds,
  zDisplayOptions,
} from "@/validators/zod-rules";

export const createMetricSettingsSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
  body: z
    .object({
      goalEnabled: z.boolean().optional().default(false),
      goalType: zGoalType,
      goalValue: zGoalValue,
      timeFrameEnabled: z.boolean().optional().default(false),
      startDate: zDateOptional.optional().nullable(),
      deadlineDate: zDateOptional.optional().nullable(),
      alertEnabled: z.boolean().optional().default(false),
      alertThresholds: zAlertThresholds,
      displayOptions: zDisplayOptions,
    })
    .refine(
      (data) => {
        if (data.goalEnabled) {
          return data.goalType !== null && data.goalValue !== null;
        }
        return true;
      },
      {
        message:
          "goalType and goalValue are required when goalEnabled is true.",
      }
    )
    .refine(
      (data) => {
        if (data.timeFrameEnabled) {
          return (
            data.startDate &&
            data.deadlineDate &&
            data.deadlineDate > data.startDate
          );
        }
        return true;
      },
      {
        message:
          "startDate and deadlineDate are required, and deadlineDate must be after startDate when timeFrameEnabled is true.",
      }
    ),
});

export const updateMetricSettingsSchema = createMetricSettingsSchema.extend({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

export const getMetricSettingsSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

export const deleteMetricSettingsSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});
