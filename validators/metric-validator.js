const { z } = require("zod");

const createMetricSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    originalMetricId: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required"),
    unit: z.string().min(1, "Unit is required"),
    version: z.number().optional(),
    isPublic: z.boolean().optional(),
  }),
});

const updateMetricSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    categoryId: z.string().uuid().optional(),
    originalMetricId: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
    version: z.number().optional(),
    isPublic: z.boolean().optional(),
  }),
});

const deleteMetricSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const getMetricByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

module.exports = {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricByIdSchema,
};
