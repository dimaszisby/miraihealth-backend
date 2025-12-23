import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { openApiDocument, registry } from "./openapi-config.js";
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
  MetricCategoryCursorResponseSchema,
  MetricCategoryCursorQueryParamsSchema,
  MetricSchema,
  CreateMetricRequestSchema,
  UpdateMetricRequestSchema,
  MetricListResponseSchema,
  MetricCursorResponseSchema,
  MetricCursorQueryParamsSchema,
  MetricDetailResponseSchema,
  MetricDetailQueryParamsSchema,
  MetricLogSchema,
  CreateMetricLogRequestSchema,
  UpdateMetricLogRequestSchema,
  MetricLogListResponseSchema,
  MetricLogStatsResponseSchema,
  MetricLogCursorResponseSchema,
  MetricLogCursorQueryParamsSchema,
  MetricSettingsSchema,
  CreateMetricSettingsRequestSchema,
  UpdateMetricSettingsRequestSchema,
  UpdateDisplayOptionsRequestSchema,
  MetricSettingsListResponseSchema,
  MetricSettingsCursorResponseSchema,
  MetricSettingsCursorQueryParamsSchema,
  TrendDataPointSchema,
  TrendResponseSchema,
  GetTrendRequestSchema,
  MetricIdQuerySchema,
  MetricIdRequiredQuerySchema,
  VisualizationResponseSchema,
  DashboardVisualizationResponseSchema,
  VisualizationQueryParamsSchema,
  DashboardVisualizationQueryParamsSchema,
  UuidSchema,
  ErrorSchema,
  ValidationErrorSchema,
  SuccessResponseSchema,
} from "./openapi-schemas.js";
import {
  GetByIdParamSchema,
  GetTrendParamsSchema,
  GetTrendQuerySchema,
} from "@/types/api/zod-request-params.schema.js";

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
  path: "/auth/profile",
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
  method: "put",
  path: "/auth/profile",
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

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Log out the current user",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "User logged out successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
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
  request: {
    query: MetricCategoryCursorQueryParamsSchema,
  },
  responses: {
    200: {
      description: "Cursor-based list of metric categories",
      content: {
        "application/json": {
          schema: MetricCategoryCursorResponseSchema,
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
  method: "put",
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
  request: {
    query: MetricCursorQueryParamsSchema,
  },
  responses: {
    200: {
      description: "Cursor-based list of metrics",
      content: {
        "application/json": {
          schema: MetricCursorResponseSchema,
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
    query: MetricDetailQueryParamsSchema,
  },
  responses: {
    200: {
      description: "Metric details",
      content: {
        "application/json": {
          schema: MetricDetailResponseSchema,
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
  method: "put",
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
  request: {
    query: MetricLogCursorQueryParamsSchema,
  },
  responses: {
    200: {
      description: "Cursor-based list of metric logs",
      content: {
        "application/json": {
          schema: MetricLogCursorResponseSchema,
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
  path: "/metric-logs/stats",
  tags: ["Metric Logs"],
  summary: "Get aggregated statistics for metric logs",
  security: [{ BearerAuth: [] }],
  request: {
    query: MetricIdQuerySchema,
  },
  responses: {
    200: {
      description: "Aggregated statistics for the requested logs",
      content: {
        "application/json": {
          schema: MetricLogStatsResponseSchema,
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
    query: MetricIdRequiredQuerySchema,
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
  method: "put",
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
  request: {
    query: MetricSettingsCursorQueryParamsSchema,
  },
  responses: {
    200: {
      description: "Cursor-based list of metric settings",
      content: {
        "application/json": {
          schema: MetricSettingsCursorResponseSchema,
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
    query: MetricIdRequiredQuerySchema,
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
  method: "put",
  path: "/metric-settings/{id}",
  tags: ["Metric Settings"],
  summary: "Update metric settings by ID",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
    query: MetricIdRequiredQuerySchema,
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
    query: MetricIdRequiredQuerySchema,
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

registry.registerPath({
  method: "patch",
  path: "/metric-settings/{id}/achieve",
  tags: ["Metric Settings"],
  summary: "Toggle goal achievement for metric settings",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
    query: MetricIdRequiredQuerySchema,
  },
  responses: {
    200: {
      description: "Goal achievement updated successfully",
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
  path: "/metric-settings/{id}/display",
  tags: ["Metric Settings"],
  summary: "Update metric settings display options",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
    query: MetricIdRequiredQuerySchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateDisplayOptionsRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Display options updated successfully",
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

// Define paths for Trends
registry.registerPath({
  method: "get",
  path: "/metrics/{metricId}/trends",
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

// Analytics paths
registry.registerPath({
  method: "get",
  path: "/analytics/dashboard",
  tags: ["Analytics"],
  summary: "Get aggregated dashboard visualizations",
  security: [{ BearerAuth: [] }],
  request: {
    query: DashboardVisualizationQueryParamsSchema,
  },
  responses: {
    200: {
      description: "Dashboard visualization payload",
      content: {
        "application/json": {
          schema: DashboardVisualizationResponseSchema,
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
  path: "/analytics/metrics/{metricId}",
  tags: ["Analytics"],
  summary: "Get visualization data for a metric",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetTrendParamsSchema,
    query: VisualizationQueryParamsSchema,
  },
  responses: {
    200: {
      description: "Visualization payload for the requested metric",
      content: {
        "application/json": {
          schema: VisualizationResponseSchema,
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
  // Generate a full OpenAPI document from the registry, seeded with the base config.
  const document = generator.generateDocument(openApiDocument);

  // Ensure we preserve and merge base components (securitySchemes, responses, etc.)
  // with any components generated from Zod schemas (schemas, parameters, ...).
  const baseComponents = openApiDocument.components ?? {};
  const generatedComponents = document.components ?? {};

  document.components = {
    ...baseComponents,
    ...generatedComponents,
    schemas: {
      ...(baseComponents as any).schemas,
      ...(generatedComponents as any).schemas,
    },
    responses: {
      ...(baseComponents as any).responses,
      ...(generatedComponents as any).responses,
    },
    securitySchemes: {
      ...(baseComponents as any).securitySchemes,
      ...(generatedComponents as any).securitySchemes,
    },
    parameters: {
      ...(baseComponents as any).parameters,
      ...(generatedComponents as any).parameters,
    },
  };

  return document;
};
