const { z } = require("zod");

// CREATE MetricCategory Schema
const createMetricCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    color: z.string().min(1).optional().default("#E897A3"),
    icon: z.string().min(1).optional().default("📁"),
  }),
});

// UPDATE MetricCategory Schema
const updateMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid metricCategory ID"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
  }),
});

// GET MetricCategory Schema
const getMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid MetricCategory ID"),
  }),
});

// DELETE MetricCategory Schema
const deleteMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid MetricCategory ID"),
  }),
});

module.exports = {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  getMetricCategorySchema,
  deleteMetricCategorySchema
};
