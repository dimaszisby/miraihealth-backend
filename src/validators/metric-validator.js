const { z } = require("zod");

// CREATE Metric Schema
const createMetricSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid("Invalid categoryId").optional(),
    originalMetricId: z.string().uuid("Invalid originalMetricId").optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    defaultUnit: z.string().min(1, "Unit is required"),
    isPublic: z.boolean().optional().default(true),
    deleted: z.date().optional(),
  }),
});

// UPDATE Metric Schema
const updateMetricSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Metric ID"),
  }),
  body: z.object({
    categoryId: z.string().uuid("Invalid categoryId").optional(),
    originalMetricId: z.string().uuid("Invalid originalMetricId").optional(),
    name: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
    description: z.string().optional(),
    defaultUnit: z.string().min(1),
    isPublic: z.boolean().optional(),
    deleted: z.date().optional(),
  }),
});

// GET Metric Schema
const getMetricSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Metric ID"),
  }),
});

// DELETE Metric Schema
const deleteMetricSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Metric ID"),
  }),
});

module.exports = {
  createMetricSchema,
  updateMetricSchema,
  getMetricSchema,
  deleteMetricSchema,
};
