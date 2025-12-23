import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { UuidSchema } from "@/lib/openapi/openapi-schemas.js";

extendZodWithOpenApi(z);

/**
 * * Zod Schemas for Request Parameters
 */

export const GetByIdParamSchema = z.object({
  id: UuidSchema.openapi({
    param: {
      name: "id",
      in: "path",
      required: true,
      description: "A UUID identifier for the resource",
    },
  }),
});

export const GetTrendParamsSchema = z.object({
  metricId: UuidSchema.openapi({
    param: {
      name: "metricId",
      in: "path",
      required: true,
      description: "UUID identifier of the metric",
    },
  }),
});

export const GetTrendQuerySchema = z.object({
  startDate: z.string().datetime().optional().openapi({
    param: {
      name: "startDate",
      in: "query",
      required: false,
      description: "Start date for trend data (ISO 8601 format)",
      example: "2023-01-01T00:00:00Z",
    },
  }),
  endDate: z.string().datetime().optional().openapi({
    param: {
      name: "endDate",
      in: "query",
      required: false,
      description: "End date for trend data (ISO 8601 format)",
      example: "2023-01-31T23:59:59Z",
    },
  }),
  interval: z.enum(["daily", "weekly", "monthly"]).optional().openapi({
    param: {
      name: "interval",
      in: "query",
      required: false,
      description: "Aggregation interval for trend data",
      example: "daily",
    },
  }),
});