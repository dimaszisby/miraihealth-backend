// src/metric-category.validator.ts

import { z } from "zod";

/**
 * * Metric Category Schema Validator
 * Defines validation schemas for metric category-related requests.
 */

// ✅ CREATE MetricCategory Schema
export const createMetricCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Name is required" }),
    color: z.string().min(1).optional().default("#E897A3"),
    icon: z.string().min(1).optional().default("📁"),
  }),
});

// ✅ UPDATE MetricCategory Schema
export const updateMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid MetricCategory ID" }),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
  }),
});

// ✅ GET MetricCategory Schema
export const getMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid MetricCategory ID" }),
  }),
});

// ✅ DELETE MetricCategory Schema
export const deleteMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid MetricCategory ID" }),
  }),
});
