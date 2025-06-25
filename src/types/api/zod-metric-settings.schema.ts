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
  body: z
    .object({
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
      },
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
      },
    ),
});

export const updateMetricSettingsSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
  body: z.object({
    goalEnabled: z.boolean().optional(),
    goalType: zGoalType.optional(),
    goalValue: zGoalValue.optional(),
    timeFrameEnabled: z.boolean().optional(),
    startDate: zDateOptional.optional().nullable(),
    deadlineDate: zDateOptional.optional().nullable(),
    alertEnabled: z.boolean().optional(),
    alertThresholds: zAlertThresholds.optional(),
    displayOptions: zDisplayOptions.optional(),
  }),
});

export const getMetricSettingsSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});

export const getAllMetricSettingsSchema = z.object({
  query: z.object({
    metricId: zUUID.optional(),
  }).optional(),
});

export const deleteMetricSettingsSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});
