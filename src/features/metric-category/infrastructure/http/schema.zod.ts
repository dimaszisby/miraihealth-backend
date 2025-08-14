// src/features/metric-category/infrastructure/http/schema.zod.ts

import { z } from "zod";
import { ZodMessages } from "@/constants/zod/zod-messages";
import {
  zMetricCategoryName,
  zMetricCategoryColor,
  zMetricCategoryIcon,
} from "@/constants/zod/zod-rules";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// * Base
export const metricCategoryBody = z.object({
  name: zMetricCategoryName,
  color: zMetricCategoryColor,
  icon: zMetricCategoryIcon,
});

export const metricCategoryParams = z.object({
  id: z.string().uuid({ message: ZodMessages.metricCategory.invalidId }),
});

export const listCategoriesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum([
      "createdAt",
      "-createdAt",
      "updatedAt",
      "-updatedAt",
      "name",
      "-name",
      "metricCount",
      "-metricCount",
    ] as const)
    .default("-createdAt"),
  q: z.string().trim().min(1).optional(),
  ["filter[name]"]: z.string().trim().min(1).optional(),
  after: z.string().optional(),
  includeTotal: z.coerce.boolean().default(false),
});

// * Schema Implementations
export const createMetricCategorySchema = { body: metricCategoryBody };
export const updateMetricCategorySchema = {
  params: metricCategoryParams,
  body: metricCategoryBody.partial(),
};
export const getMetricCategorySchema = { params: metricCategoryParams };
export const deleteMetricCategorySchema = { params: metricCategoryParams };
export const getAllMetricCategoriesSchema = { query: listCategoriesQuery };

/**
 * * ===== Schemas for Testing Purposes =====
 */

export const createMetricCategoryDummyBody = z.object({
  // id: z.string().uuid({ message: ZodMessages.metricCategory.invalidId }),
  count: z.number().int().min(1).max(1000).default(5), // Default to 5, max 1000
});

export const generateDummyMetricCategoriesSchema = {
  body: createMetricCategoryDummyBody,
};
