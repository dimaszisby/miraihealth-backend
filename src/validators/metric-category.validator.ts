// src/metric-category.validator.ts

import { z } from "zod";
import {
  createMetricCategorySchema as createMetricCategorySchemaApi,
  updateMetricCategorySchema as updateMetricCategorySchemaApi,
  getMetricCategorySchema as getMetricCategorySchemaApi,
  deleteMetricCategorySchema as deleteMetricCategorySchemaApi,
  generateDummyMetricCategoriesSchema as generateDummyMetricCategoriesSchemaApi,
} from "@/types/api/zod-metric-category.schema";

/**
 * * Metric Category Schema Validator
 * Defines validation schemas for metric category-related requests.
 */

// ✅ CREATE MetricCategory Schema
export const createMetricCategorySchema = createMetricCategorySchemaApi;

// ✅ UPDATE MetricCategory Schema
export const updateMetricCategorySchema = updateMetricCategorySchemaApi;

// ✅ GET MetricCategory Schema
export const getMetricCategorySchema = getMetricCategorySchemaApi;

// ✅ DELETE MetricCategory Schema
export const deleteMetricCategorySchema = deleteMetricCategorySchemaApi;

// ✅ Generate Dummy Metric Categories Schema
export const generateDummyMetricCategoriesSchema =
  generateDummyMetricCategoriesSchemaApi;
