// src/validators/metric-log.validator.ts

import { z } from "zod";
import {
  createMetricLogSchema as createMetricLogSchemaApi,
  updateMetricLogSchema as updateMetricLogSchemaApi,
  getAllMetricLogsSchema as getAllMetricLogsSchemaApi,
  getMetricLogSchema as getMetricLogSchemaApi,
  deleteMetricLogSchema as deleteMetricLogSchemaApi,
  getAggregatedStatsSchema as getAggregatedStatsSchemaApi,
  generateDummyMetricLogsSchema as generateDummyMetricLogsSchemaApi,
} from "@/types/api/zod-metric-log.schema";

/**
 * * Metric Log Schema Validator
 * Defines validation schemas for metric log-related requests.
 */

// Helper to preprocess date fields
const preprocessDate = (arg: unknown) =>
  typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg;

// ✅ CREATE MetricLog Schema
export const createMetricLogSchema = createMetricLogSchemaApi;

// ✅ UPDATE MetricLog Schema
export const updateMetricLogSchema = updateMetricLogSchemaApi;

// ✅ GET All MetricLogs Schema
export const getAllMetricLogsSchema = getAllMetricLogsSchemaApi;

// ✅ GET MetricLog Schema
export const getMetricLogSchema = getMetricLogSchemaApi;

// ✅ DELETE MetricLog Schema
export const deleteMetricLogSchema = deleteMetricLogSchemaApi;

// ✅ GET Aggregated Stats Schema
export const getAggregatedStatsSchema = getAggregatedStatsSchemaApi;

// ✅ Generate Dummy Metric Logs Schema
export const generateDummyMetricLogsSchema = generateDummyMetricLogsSchemaApi;
