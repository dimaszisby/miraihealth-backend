// src/types/dtos/metric.dto.ts

import { z } from "zod";

// Internal validation schemas
import {
  createMetricSchema,
  updateMetricSchema,
} from "@/types/api/zod-metric.schema";

// Internal DTOs for associations
import { MetricCategoryResponseDTO } from "./metric-category.dto";
import { MetricSettingsResponseDTO } from "./metric-settings.dto";
import { MetricLogResponseDTO } from "./metric-log.dto";

// DTO for basic metric responses (e.g., after create/update)
export interface MetricResponseDTO {
  id: string;
  userId: string;
  categoryId: string | null;
  originalMetricId: string | null;
  name: string;
  description: string | null;
  defaultUnit: string;
  isPublic: boolean;
  // deletedAt?: string | null; // Removed
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

// DTO for metric list items (preview)
export interface MetricPreviewResponseDTO {
  id: string;
  name: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  goalType?: string;
}

// DTO for the full list of metric previews
export type MetricListResponseDTO = MetricPreviewResponseDTO[];

// DTO for detailed metric response (including associations)
export interface UserMetricDetailResponseDTO {
  id: string;
  userId: string;
  categoryId: string | null;
  originalMetricId: string | null;
  name: string;
  description: string | null;
  defaultUnit: string;
  isPublic: boolean;
  // deletedAt?: string | null; // Removed
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string

  // Use specific DTOs for associations
  category?: MetricCategoryResponseDTO | null;
  settings?: MetricSettingsResponseDTO | null;
  logs?: MetricLogResponseDTO[] | null;
}

// Request DTOs inferred from Zod schemas
export type CreateMetricRequestDTO = z.infer<
  typeof createMetricSchema.shape.body
>;
export type UpdateMetricRequestDTO = z.infer<
  typeof updateMetricSchema.shape.body
>;
