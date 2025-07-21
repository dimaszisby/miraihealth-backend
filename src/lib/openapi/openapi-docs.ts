// src/lib/openapi/openapi-docs.ts

import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { openApiDocument, registry } from "./openapi-config";
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  UserResponseSchema,
  UpdateUserRequestSchema,
  MetricCategorySchema,
  CreateMetricCategoryRequestSchema,
  UpdateMetricCategoryRequestSchema,
  MetricCategoryListResponseSchema,
  MetricSchema,
  CreateMetricRequestSchema,
  UpdateMetricRequestSchema,
  MetricListResponseSchema,
  MetricLogSchema,
  CreateMetricLogRequestSchema,
  UpdateMetricLogRequestSchema,
  MetricLogListResponseSchema,
  MetricSettingsSchema,
  CreateMetricSettingsRequestSchema,
  UpdateMetricSettingsRequestSchema,
  MetricSettingsListResponseSchema,
  TrendDataPointSchema,
  TrendResponseSchema,
  GetTrendRequestSchema,
  UuidSchema,
  ErrorSchema,
  ValidationErrorSchema,
  SuccessResponseSchema,
} from "./openapi-schemas";
import {
  GetByIdParamSchema,
  GetTrendParamsSchema,
  GetTrendQuerySchema,
} from "@/types/api/zod-request-params.schema";

// Register all schemas with the OpenAPIRegistry
// This is done in openapi-schemas.ts directly using registry.register

// Define paths for Auth
registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully",
      content: {
        "application/json": {
          schema: LoginResponseSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Log in a user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User logged in successfully",
      content: {
        "application/json": {
          schema: LoginResponseSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Get current user's profile",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "Current user profile",
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Update current user's profile",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateUserRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User profile updated successfully",
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

// Define paths for Metric Categories
registry.registerPath({
  method: "post",
  path: "/metric-categories",
  tags: ["Metric Categories"],
  summary: "Create a new metric category",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateMetricCategoryRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Metric category created successfully",
      content: {
        "application/json": {
          schema: MetricCategorySchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/metric-categories",
  tags: ["Metric Categories"],
  summary: "Get all metric categories for the authenticated user",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "List of metric categories",
      content: {
        "application/json": {
          schema: MetricCategoryListResponseSchema,
        },
      },
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/metric-categories/{id}",
  tags: ["Metric Categories"],
  summary: "Get a single metric category by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    200: {
      description: "Metric category details",
      content: {
        "application/json": {
          schema: MetricCategorySchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/metric-categories/{id}",
  tags: ["Metric Categories"],
  summary: "Update a metric category by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateMetricCategoryRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Metric category updated successfully",
      content: {
        "application/json": {
          schema: MetricCategorySchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/metric-categories/{id}",
  tags: ["Metric Categories"],
  summary: "Delete a metric category by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    204: {
      description: "Metric category deleted successfully",
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

// Define paths for Metrics
registry.registerPath({
  method: "post",
  path: "/metrics",
  tags: ["Metrics"],
  summary: "Create a new metric",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateMetricRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Metric created successfully",
      content: {
        "application/json": {
          schema: MetricSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/metrics",
  tags: ["Metrics"],
  summary: "Get all metrics for the authenticated user",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "List of metrics",
      content: {
        "application/json": {
          schema: MetricListResponseSchema,
        },
      },
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/metrics/{id}",
  tags: ["Metrics"],
  summary: "Get a single metric by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    200: {
      description: "Metric details",
      content: {
        "application/json": {
          schema: MetricSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/metrics/{id}",
  tags: ["Metrics"],
  summary: "Update a metric by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateMetricRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Metric updated successfully",
      content: {
        "application/json": {
          schema: MetricSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/metrics/{id}",
  tags: ["Metrics"],
  summary: "Delete a metric by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    204: {
      description: "Metric deleted successfully",
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

// Define paths for Metric Logs
registry.registerPath({
  method: "post",
  path: "/metric-logs",
  tags: ["Metric Logs"],
  summary: "Create a new metric log",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateMetricLogRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Metric log created successfully",
      content: {
        "application/json": {
          schema: MetricLogSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/metric-logs",
  tags: ["Metric Logs"],
  summary: "Get all metric logs for the authenticated user",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "List of metric logs",
      content: {
        "application/json": {
          schema: MetricLogListResponseSchema,
        },
      },
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/metric-logs/{id}",
  tags: ["Metric Logs"],
  summary: "Get a single metric log by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    200: {
      description: "Metric log details",
      content: {
        "application/json": {
          schema: MetricLogSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/metric-logs/{id}",
  tags: ["Metric Logs"],
  summary: "Update a metric log by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateMetricLogRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Metric log updated successfully",
      content: {
        "application/json": {
          schema: MetricLogSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/metric-logs/{id}",
  tags: ["Metric Logs"],
  summary: "Delete a metric log by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    204: {
      description: "Metric log deleted successfully",
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

// Define paths for Metric Settings
registry.registerPath({
  method: "post",
  path: "/metric-settings",
  tags: ["Metric Settings"],
  summary: "Create new metric settings",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateMetricSettingsRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Metric settings created successfully",
      content: {
        "application/json": {
          schema: MetricSettingsSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/metric-settings",
  tags: ["Metric Settings"],
  summary: "Get all metric settings for the authenticated user",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "List of metric settings",
      content: {
        "application/json": {
          schema: MetricSettingsListResponseSchema,
        },
      },
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/metric-settings/{id}",
  tags: ["Metric Settings"],
  summary: "Get single metric settings by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    200: {
      description: "Metric settings details",
      content: {
        "application/json": {
          schema: MetricSettingsSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/metric-settings/{id}",
  tags: ["Metric Settings"],
  summary: "Update metric settings by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateMetricSettingsRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Metric settings updated successfully",
      content: {
        "application/json": {
          schema: MetricSettingsSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/metric-settings/{id}",
  tags: ["Metric Settings"],
  summary: "Delete metric settings by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    204: {
      description: "Metric settings deleted successfully",
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

// Define paths for Trends
registry.registerPath({
  method: "get",
  path: "/trends/{metricId}",
  tags: ["Trends"],
  summary: "Get trend data for a specific metric",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetTrendParamsSchema,
    query: GetTrendQuerySchema,
  },
  responses: {
    200: {
      description: "Trend data for the metric",
      content: {
        "application/json": {
          schema: TrendResponseSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    404: {
      $ref: "#/components/responses/NotFoundError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

export const getOpenApiDocumentation = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument(openApiDocument);
  return {
    ...openApiDocument,
    paths: document.paths,
  };
};