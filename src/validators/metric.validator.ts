// src/metric.validator.ts

import { z } from "zod";
import {
  createMetricSchema as createMetricSchemaApi,
  updateMetricSchema as updateMetricSchemaApi,
  getMetricSchema as getMetricSchemaApi,
  deleteMetricSchema as deleteMetricSchemaApi,
  generateDummyMetricsSchema as generateDummyMetricsSchemaApi,
} from "@/types/api/zod-metric.schema";

/**
 * * Metric Schema Validator
 * Defines validation schemas for metric-related requests.
 */

// ✅ CREATE Metric Schema
export const createMetricSchema = createMetricSchemaApi;

// ✅ UPDATE Metric Schema
export const updateMetricSchema = updateMetricSchemaApi;

// ✅ GET Metric Schema
export const getMetricSchema = getMetricSchemaApi;

// ✅ DELETE Metric Schema
export const deleteMetricSchema = deleteMetricSchemaApi;

// ✅ Generate Dummy Metrics Schema
export const generateDummyMetricsSchema = generateDummyMetricsSchemaApi;
