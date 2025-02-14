import { z } from "zod";

/**
 * * Metric Schema Validator
 * Defines validation schemas for metric-related requests.
 */

// ✅ CREATE Metric Schema
export const createMetricSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid({ message: "Invalid categoryId" }).optional(),
    originalMetricId: z
      .string()
      .uuid({ message: "Invalid originalMetricId" })
      .optional(),
    name: z.string().min(1, { message: "Name is required" }),
    description: z.string().optional(),
    defaultUnit: z.string().min(1, { message: "Unit is required" }),
    isPublic: z.boolean().optional().default(true),
    deletedAt: z.date().optional(), // ✅ Fixed 'deleted' -> 'deletedAt' for consistency with DB schema
  }),
});

// ✅ UPDATE Metric Schema
export const updateMetricSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid Metric ID" }),
  }),
  body: z.object({
    categoryId: z.string().uuid({ message: "Invalid categoryId" }).optional(),
    originalMetricId: z
      .string()
      .uuid({ message: "Invalid originalMetricId" })
      .optional(),
    name: z.string().min(1).optional(),
    defaultUnit: z.string().min(1).optional(), // ✅ Fixed 'unit' -> 'defaultUnit' for consistency
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
    deletedAt: z.date().optional(), // ✅ Fixed typo
  }),
});

// ✅ GET Metric Schema
export const getMetricSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid Metric ID" }),
  }),
});

// ✅ DELETE Metric Schema
export const deleteMetricSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid Metric ID" }),
  }),
});
