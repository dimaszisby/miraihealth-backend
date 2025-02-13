const { z } = require("zod");

// * Helper Enums & Schemas
// Schema for Display Options
const displayOptionsSchema = z.object({
  show_on_dashboard: z.boolean().optional().default(true),
  priority: z.number().optional().default(1),
  chart_type: z.string().optional().default("line"),
});

// Schema for Reminder Settings
const reminderSettingsSchema = z.object({
  enabled: z.boolean().optional().default(false),
  frequency: z.string().nullable(),
  time: z.string().nullable(), // Expecting time in HH:MM format
});

// * Validators
// CREATE MetricSettings Schema
const createMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metric ID"),
  }),

  body: z
    .object({
      // * Toggle for enabling a goal
      goalEnabled: z.boolean().optional().default(false),
      goalType: z.enum(["cumulative", "incremental"]).optional().nullable(), // If goalEnabled is true, goalType must be provided; otherwise, it can be null
      goalValue: z // Goal value must be positive and is required when goalEnabled is true
        .number()
        .positive("Goal value must be greater than 0")
        .optional()
        .nullable(),
      // * Toggle for enabling a time frame (start and deadline dates)
      timeFrameEnabled: z.boolean().optional().default(false),
      // Use preprocess to allow string dates
      startDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date)
          return new Date(arg);
      }, z.date().optional().nullable()),
      deadlineDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date)
          return new Date(arg);
      }, z.date().optional().nullable()),

      // * Toggle for enabling alerts
      alertsEnabled: z.boolean().optional().default(false),
      // Alert threshold for warning (0-100); if not provided, default is 80
      alertThresholds: z
        .number()
        .int("Alert threshold must be an integer")
        .min(0, "Alert threshold must be at least 0")
        .max(100, "Alert threshold must be at most 100")
        .optional()
        .default(80),
      // Display options for showing the metric on the dashboard
      displayOptions: z
        .object({
          showOnDashboard: z.boolean().optional().default(true),
          priority: z.number().optional().default(1),
          chartType: z.string().optional().default("line"),
          color: z.string().optional().default("#E897A3"),
        })
        .optional(),
    })
    // Constraints Validation:
    // When goalEnabled is true, goalType and goalValue must be provided
    .refine(
      (data) => {
        if (data.goalEnabled) {
          return (
            data.goalType !== null &&
            data.goalType !== undefined &&
            data.goalValue !== null &&
            data.goalValue !== undefined
          );
        }
        return true;
      },
      {
        message:
          "goalType and goalValue are required when goalEnabled is true.",
        path: ["body"],
      }
    )
    // Constraints Validation:
    // When timeFrameEnabled is true, startDate and deadlineDate must be provided and deadlineDate must be after startDate
    .refine(
      (data) => {
        if (data.timeFrameEnabled) {
          if (!data.startDate || !data.deadlineDate) return false;
          return data.deadlineDate > data.startDate;
        }
        return true;
      },
      {
        message:
          "startDate and deadlineDate are required, and deadlineDate must be after startDate when timeFrameEnabled is true.",
        path: ["body"],
      }
    ),
});

// Update MetricSettings Schema
const updateMetricSettingsSchema = createMetricSettingsSchema.extend({
  params: z.object({
    metricId: z.string().uuid("Invalid metric ID"),
    id: z.string().uuid("Invalid metric settings ID"),
  }),
});

// Get All MetricSettings Schema
const getAllMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metric ID"),
  }),
});

// Get a Specific MetricSettings Schema
const getMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metric ID"),
    id: z.string().uuid("Invalid metric settings ID"),
  }),
});

// Delete MetricSettings Schema
const deleteMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metric ID"),
    id: z.string().uuid("Invalid metric settings ID"),
  }),
});

module.exports = {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
  getAllMetricSettingsSchema,
  getMetricSettingsSchema,
  deleteMetricSettingsSchema,
};
