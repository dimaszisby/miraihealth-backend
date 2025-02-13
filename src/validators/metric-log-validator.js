const { z } = require("zod");

// CREATE MetricLog Schema
const createMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
  }),
  body: z.object({
    logValue: z.number().nonnegative("logValue must be non-negative"),
    type: z.string().min(1).optional().default("manual"),
  }),
});

// UPDATE MetricLog Schema
const updateMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
    id: z.string().uuid("Invalid MetricLog ID"),
  }),
  body: z.object({
    logValue: z.number().nonnegative().optional(),
    type: z.string().min(1).optional(),
  }),
});

// GET All MetricLogs Schema
const getAllMetricLogsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
  }),
});

// GET MetricLog Schema
const getMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
    id: z.string().uuid("Invalid MetricLog ID"),
  }),
});

// DELETE MetricLog Schema
const deleteMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid("Invalid metricId"),
    id: z.string().uuid("Invalid MetricLog ID"),
  }),
});

module.exports = {
  createMetricLogSchema,
  updateMetricLogSchema,
  getAllMetricLogsSchema,
  getMetricLogSchema,
  deleteMetricLogSchema,
};
