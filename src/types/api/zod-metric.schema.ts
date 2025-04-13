// ✅ src/types/api/zod-metric.schema.ts

import { z } from "zod";
import {
  zUUID,
  zMetricName,
  zMetricCategoryId,
  zMetricDescription,
  zMetricDefaultUnit,
  zMetricIsPublic,
  zMetricOriginalId,
  zMetricDeletedAt,
} from "@/validators/zod-rules";

export const createMetricSchema = z.object({
  body: z.object({
    categoryId: zMetricCategoryId.optional(),
    originalMetricId: zMetricOriginalId.optional(),
    name: zMetricName,
    description: zMetricDescription.optional(),
    defaultUnit: zMetricDefaultUnit,
    isPublic: zMetricIsPublic,
    // deletedAt should likely not be part of create/update via API
    // deletedAt: zMetricDeletedAt,
  }),
});

export const updateMetricSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
  // Make all fields optional for update
  body: z.object({
    categoryId: zMetricCategoryId.optional(),
    originalMetricId: zMetricOriginalId.optional(),
    name: zMetricName.optional(),
    description: zMetricDescription.optional(),
    defaultUnit: zMetricDefaultUnit.optional(),
    isPublic: zMetricIsPublic.optional(),
    // deletedAt should likely not be part of create/update via API
    // deletedAt: zMetricDeletedAt.optional(),
  }),
});

export const getMetricSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});

export const deleteMetricSchema = getMetricSchema;

// Infer TypeScript types from schemas
export type CreateMetricInput = z.infer<typeof createMetricSchema>["body"];
export type UpdateMetricInput = z.infer<typeof updateMetricSchema>; // Includes params and body
export type GetMetricInput = z.infer<typeof getMetricSchema>["params"];
export type DeleteMetricInput = z.infer<typeof deleteMetricSchema>["params"];
