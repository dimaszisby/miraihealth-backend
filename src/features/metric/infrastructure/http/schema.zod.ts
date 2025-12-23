import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  zUUID,
  zMetricName,
  zMetricCategoryId,
  zMetricDescription,
  zMetricDefaultUnit,
  zMetricIsPublic,
  zMetricOriginalId,
} from "@/constants/zod/zod-rules.js";

extendZodWithOpenApi(z);

const FilterSchema = z.object({
  ["filter[name]"]: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1).optional()
  ),
  ["filter[categoryId]"]: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    zUUID.optional()
  ),
  filter: z
    .object({
      name: z.preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z.string().min(1).optional()
      ),
      categoryId: zUUID.optional(),
    })
    .partial()
    .optional(),
});

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

export const metricBodyPartial = metricBody.partial();

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

const listMetricQueryRaw = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum([
        "createdAt",
        "-createdAt",
        "updatedAt",
        "-updatedAt",
        "name",
        "-name",
        "logCount",
        "-logCount",
      ] as const)
      .default("-createdAt"),
    q: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(1).optional()
    ),
    after: z.string().optional(),
    includeTotal: z.coerce.boolean().default(false),
  })
  .merge(FilterSchema);

export const listMetricQueryViaCursor = listMetricQueryRaw.transform((v) => {
  const name = v["filter[name]"] ?? v.filter?.name;
  const categoryId = v["filter[categoryId]"] ?? v.filter?.categoryId;

  const filter: { name?: string; categoryId?: string } = {};
  if (name) filter.name = name;
  if (categoryId) filter.categoryId = categoryId;

  return {
    limit: v.limit,
    sort: v.sort,
    q: v.q,
    after: v.after,
    includeTotal: v.includeTotal,
    filter: Object.keys(filter).length ? filter : undefined,
  };
});

export const listMetricQueryDocSchema = listMetricQueryRaw;

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

/** ===== Schema Bags ===== */
export const createMetricSchema = z.object({ body: metricBody });
export const updateMetricSchema = z.object({
  params: metricParams,
  body: metricBodyPartial,
});
export const getMetricSchema = z.object({
  params: metricParams,
  query: metricDetailQuery,
});
export const deleteMetricSchema = z.object({ params: metricParams });
export const getAllMetricsSchema = z.object({ query: listMetricsQuery });
export const getAllMetricsViaCursorSchema = z.object({
  query: listMetricQueryViaCursor,
});

export const generateDummyMetricsBody = z.object({
  count: z.coerce.number().int().min(1).max(1000).default(50),
});
export const generateDummyMetricsSchema = z.object({
  body: generateDummyMetricsBody,
});

/** ===== Types ===== */
export type CreateMetricInput = z.infer<typeof metricBody>;
export type UpdateMetricInput = z.infer<typeof metricBodyPartial>;
export type GetMetricParams = z.infer<typeof metricParams>;
export type GetMetricDetailQuery = z.infer<typeof metricDetailQuery>;
export type ListMetricsQuery = z.infer<typeof listMetricsQuery>;
