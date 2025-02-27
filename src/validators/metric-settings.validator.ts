//src/validators/metric-settings-validator.ts

import { z } from "zod";

/**
 * * Metric Settings Schema Validator
 * Defines validation schemas for metric settings-related requests.
 */

// ✅ Helper Schemas
const displayOptionsSchema = z.object({
  showOnDashboard: z.boolean().optional().default(true),
  priority: z.number().optional().default(1),
  chartType: z.string().optional().default("line"),
  color: z.string().optional().default("#E897A3"),
});

// ✅ CREATE MetricSettings Schema
export const createMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
  }),
  body: z
    .object({
      goalEnabled: z.boolean().optional().default(false),
      goalType: z.enum(["cumulative", "incremental"]).optional().nullable(),
      goalValue: z
        .number()
        .positive("Goal value must be greater than 0")
        .optional()
        .nullable(),
      timeFrameEnabled: z.boolean().optional().default(false),
      startDate: z.preprocess(
        (arg) =>
          typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg,
        z.date().optional().nullable()
      ),
      deadlineDate: z.preprocess(
        (arg) =>
          typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg,
        z.date().optional().nullable()
      ),
      alertEnabled: z.boolean().optional().default(false),
      alertThresholds: z
        .number()
        .int({ message: "Alert threshold must be an integer" })
        .min(0, { message: "Alert threshold must be at least 0" })
        .max(100, { message: "Alert threshold must be at most 100" })
        .optional()
        .default(80),
      displayOptions: displayOptionsSchema.optional(),
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

// ✅ UPDATE MetricSettings Schema
export const updateMetricSettingsSchema = createMetricSettingsSchema.extend({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric settings ID" }),
  }),
});

// ✅ GET All MetricSettings Schema
export const getAllMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
  }),
});

// ✅ GET Specific MetricSettings Schema
export const getMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric settings ID" }),
  }),
});

// ✅ DELETE MetricSettings Schema
export const deleteMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric settings ID" }),
  }),
});
