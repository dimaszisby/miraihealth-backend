// src/types/dtos/metric-category.dto.ts

import { z } from "zod";
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
} from "@/types/api/zod-metricCategory.schema.js";

/**
 * * Data Transfer Objects (DTO) for MetricCategory
 * For incoming/outgoing API contract.
 */

export interface MetricCategoryResponseDTO {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type CreateMetricCategoryRequestDTO = z.infer<
  typeof createMetricCategorySchema.shape.body
>;

export type UpdateMetricCategoryRequestDTO = z.infer<
  typeof updateMetricCategorySchema.shape.body
>;
