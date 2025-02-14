import { z } from "zod";

/**
 * * Metric Log Schema Validator
 * Defines validation schemas for metric log-related requests.
 */

// ✅ CREATE MetricLog Schema
export const createMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
  }),
  body: z.object({
    logValue: z
      .number()
      .nonnegative({ message: "logValue must be non-negative" }),
    type: z
      .string()
      .min(1, { message: "Type is required" })
      .optional()
      .default("manual"),
  }),
});

// ✅ UPDATE MetricLog Schema
export const updateMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric log ID" }),
  }),
  body: z.object({
    logValue: z
      .number()
      .nonnegative({ message: "logValue must be non-negative" })
      .optional(),
    type: z.string().min(1, { message: "Type is required" }).optional(),
  }),
});

// ✅ GET All MetricLogs Schema
export const getAllMetricLogsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
  }),
});

// ✅ GET MetricLog Schema
export const getMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric log ID" }),
  }),
});

// ✅ DELETE MetricLog Schema
export const deleteMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric log ID" }),
  }),
});
