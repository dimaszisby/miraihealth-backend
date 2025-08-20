import { z } from "zod";
import {
  zUUID,
  zMetricName,
  zMetricCategoryId,
  zMetricDescription,
  zMetricDefaultUnit,
  zMetricIsPublic,
  zMetricOriginalId,
} from "@/constants/zod/zod-rules";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/** ===== Base pieces ===== */
export const metricParams = z.object({ id: zUUID });

export const metricBody = z.object({
  categoryId: zMetricCategoryId.optional(),
  originalMetricId: zMetricOriginalId.optional(),
  name: zMetricName,
  description: zMetricDescription.optional(),
  defaultUnit: zMetricDefaultUnit,
  isPublic: zMetricIsPublic,
});

// all optional for update
export const metricBodyPartial = metricBody.partial();

// list query (offset for now; add cursor when ready)
export const listMetricsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum([
      "createdAt",
      "updatedAt",
      "name",
      "logCount",
      "defaultUnit",
      "isPublic",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
});

// detail include shape e.g. “flat” | “full”
const allowedIncludes = ["settings", "category", "logs"] as const;
const csvIncludes = z
  .string()
  .min(1)
  .refine(
    (val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .every((v) => (allowedIncludes as readonly string[]).includes(v)),
    {
      message:
        "include must be 'flat' | 'full' or a CSV of: settings,category,logs",
    }
  );
export const metricDetailQuery = z.object({
  include: z
    .union([z.enum(["flat", "full"]), csvIncludes])
    .optional()
    .default("flat"),
  logsLimit: z.coerce.number().int().min(1).max(200).optional().default(20),
});

/** ===== SchemaBags for validate(...) ===== */
export const createMetricSchema = { body: metricBody };
export const updateMetricSchema = {
  params: metricParams,
  body: metricBodyPartial,
};
export const getMetricSchema = {
  params: metricParams,
  query: metricDetailQuery,
};
export const deleteMetricSchema = { params: metricParams };
export const getAllMetricsSchema = { query: listMetricsQuery };

// testing
export const generateDummyMetricsBody = z.object({
  count: z.coerce.number().int().min(1).max(1000).default(50),
});
export const generateDummyMetricsSchema = { body: generateDummyMetricsBody };

/** ===== Inferred types (optional) ===== */
export type CreateMetricInput = z.infer<typeof metricBody>;
export type UpdateMetricInput = z.infer<typeof metricBodyPartial>;
export type GetMetricParams = z.infer<typeof metricParams>;
export type GetMetricDetailQuery = z.infer<typeof metricDetailQuery>;
export type ListMetricsQuery = z.infer<typeof listMetricsQuery>;
