import { z } from "zod.js";

// Internal validation schemas
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  generateDummyMetricCategoriesSchema,
} from "@/features/metric-category/infrastructure/http/schema.zod.js.js";

/**
 * @file src/types/dtos/metric-category.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for MetricCategory.
 * These interfaces and types are used for incoming and outgoing API contracts,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

/**
 * @interface MetricCategoryResponseDTO
 * @description Represents the structure of a MetricCategory object as returned in API responses.
 */
export interface MetricCategoryResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric category (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} name - The user-defined name for the metric category.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {string} color - The color code associated with the category for UI display.
   * @readonly
   */
  readonly color: string;

  /**
   * @property {string} icon - The icon identifier associated with the category.
   * @readonly
   */
  readonly icon: string;

  /**
   * @property {string} createdAt - The timestamp when the category was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;

  /**
   * @property {string} updatedAt - The timestamp when the category was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;

  /**
   * @property {string | null} [deletedAt] - The timestamp when the category was soft-deleted, formatted as an ISO string. Null if active.
   * @readonly
   */
  readonly deletedAt?: string | null;

  // Dev note: Type Added recently
  /**
   * @property {number} metricCount - The number of metrics associated with the category.
   * @readonly
   * @example 10
   */
  readonly metricCount: number;
}

/**
 * @typedef CreateMetricCategoryRequestDTO
 * @description Represents the expected structure of the request body when creating a new metric category.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricCategoryRequestDTO = z.infer<
  typeof createMetricCategorySchema.shape.body
>;

/**
 * @typedef UpdateMetricCategoryRequestDTO
 * @description Represents the expected structure of the request body when updating an existing metric category.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricCategoryRequestDTO = z.infer<
  typeof updateMetricCategorySchema.shape.body
>;

/**
 * * ===== DTOs for Testing Purposes =====
 */

/**
 * @typedef GenerateDummyMetricCategoriesRequestDTO
 * @description Represents the expected structure of the request body when generating dummy metric category entries.
 * Inferred from the Zod schema for validation.
 */
export type GenerateDummyMetricCategoriesRequestDTO = z.infer<
  typeof generateDummyMetricCategoriesSchema.shape.body
>;
