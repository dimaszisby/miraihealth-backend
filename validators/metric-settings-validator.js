const { z } = require("zod");

// CREATE MetricSettings Schema
const createMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
  }),
  body: z.object({
    isTracked: z.boolean().optional().default(true),
    goalValue: z.number().optional(),
    versionDate: z.preprocess((arg) => {
      if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    }, z.date().optional()),
  }),
});

// UPDATE MetricSettings Schema
const updateMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
    id: z.string().uuid("Invalid MetricSettings ID"),
  }),
  body: z.object({
    isTracked: z.boolean().optional(),
    goalValue: z.number().optional(),
    versionDate: z.preprocess((arg) => {
      if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    }, z.date().optional()),
  }),
});

// GET ALL MetricSettingSchema
const getAllMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
  }),
});

// GET MetricSettings Schema
const getMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
    id: z.string().uuid("Invalid MetricSettings ID"),
  }),
});

// DELETE MetricSettings Schema
const deleteMetricSettingsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
    id: z.string().uuid("Invalid MetricSettings ID"),
  }),
});

module.exports = {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
  getAllMetricSettingsSchema,
  getMetricSettingsSchema,
  deleteMetricSettingsSchema,
};
