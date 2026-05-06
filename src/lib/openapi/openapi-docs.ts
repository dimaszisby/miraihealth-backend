import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import type { ComponentsObject } from "openapi3-ts/oas31";
import { z } from "zod";
import { openApiDocument, registry } from "./openapi-config.js";
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  UserResponseSchema,
  UpdateUserResponseSchema,
  UpdateUserRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  MetricCategorySchema,
  CreateMetricCategoryRequestSchema,
  UpdateMetricCategoryRequestSchema,
  MetricCategoryCursorResponseSchema,
  MetricCategoryCursorQueryParamsSchema,
  MetricSchema,
  CreateMetricRequestSchema,
  UpdateMetricRequestSchema,
  MetricCursorResponseSchema,
  MetricCursorQueryParamsSchema,
  MetricDetailResponseSchema,
  MetricDetailQueryParamsSchema,
  MetricLogSchema,
  CreateMetricLogRequestSchema,
  UpdateMetricLogRequestSchema,
  MetricLogStatsResponseSchema,
  MetricLogCursorResponseSchema,
  MetricLogCursorQueryParamsSchema,
  GenerateDummyMetricLogsRequestSchema,
  GenerateDummyMetricLogsResponseSchema,
  MetricDisplayOptionsSchema,
  MetricSettingsSchema,
  CreateMetricSettingsRequestSchema,
  UpdateMetricSettingsRequestSchema,
  UpdateDisplayOptionsRequestSchema,
  MetricSettingsCursorResponseSchema,
  MetricSettingsCursorQueryParamsSchema,
  TrendResponseSchema,
  MetricIdQuerySchema,
  MetricIdRequiredQuerySchema,
  VisualizationResponseSchema,
  DashboardVisualizationResponseSchema,
  VisualizationQueryParamsSchema,
  DashboardVisualizationQueryParamsSchema,
  SuccessResponseSchema,
  RefreshResponseSchema,
  successEnvelope,
} from "./openapi-schemas.js";
import {
  GetByIdParamSchema,
  GetTrendParamsSchema,
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
      required: true,
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
      required: true,
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
      required: true,
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
          schema: UpdateUserResponseSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    409: {
      $ref: "#/components/responses/ConflictError",
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
  description:
    "Revokes the refresh token family associated with the presented cookie or bearer token.",
  responses: {
    200: {
      description: "User logged out successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Rotate refresh token and get a new access token",
  description:
    "Reads the `lakira_refresh` HttpOnly cookie. " +
    "Rotates the refresh token (revokes old, issues new) and returns a fresh access token. " +
    "If the presented token was already revoked, the entire token family is invalidated (reuse detection).",
  request: {
    cookies: z.object({
      lakira_refresh: z.string().openapi({
        description: "Opaque refresh token set by login",
        example: "dGVzdC1yZWZyZXNoLXRva2Vu",
      }),
    }),
  },
  responses: {
    200: {
      description: "New access token issued; new refresh cookie set",
      content: {
        "application/json": {
          schema: RefreshResponseSchema,
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
  method: "post",
  path: "/auth/forgot-password",
  tags: ["Auth"],
  summary: "Request a password reset email",
  description:
    "Always responds 200 with a generic message to prevent email enumeration. " +
    "When the email matches a registered account, a single-use reset link is sent. " +
    "Tokens are valid for 15 minutes; subsequent requests invalidate any prior unused tokens.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ForgotPasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Generic acknowledgement",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    429: {
      description: "Rate limit exceeded for password reset requests",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/reset-password",
  tags: ["Auth"],
  summary: "Confirm password reset with a token",
  description:
    "Consumes a reset token sent via email and sets a new password. Returns a generic " +
    "400 for unknown, used, expired, or otherwise invalid tokens to avoid information leak. " +
    "Caller must log in via /auth/login afterwards.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ResetPasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset succeeded",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    429: {
      description: "Rate limit exceeded for password reset requests",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
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
      required: true,
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
          schema: successEnvelope(MetricCategorySchema),
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricCategoryCursorResponseSchema),
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
          schema: successEnvelope(MetricCategorySchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricCategorySchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
    200: {
      description: "Metric category deleted successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
      required: true,
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
          schema: successEnvelope(MetricSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricCursorResponseSchema),
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
          schema: successEnvelope(MetricDetailResponseSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
    200: {
      description: "Metric deleted successfully",
      content: {
        "application/json": {
          schema: successEnvelope(MetricSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricLogSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricLogCursorResponseSchema),
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
          schema: successEnvelope(MetricLogStatsResponseSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricLogSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricLogSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
    200: {
      description: "Metric log deleted successfully",
      content: {
        "application/json": {
          schema: successEnvelope(MetricLogSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
    },
    500: {
      $ref: "#/components/responses/InternalServerError",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/metric-logs/{metricId}/dummy",
  tags: ["Metric Logs"],
  summary: "Enqueue dummy metric log generation",
  description:
    "Accepts a generation job and returns immediately with a `jobId`. " +
    "When `RABBITMQ_ENABLED=true` the inserts are processed asynchronously by the worker; " +
    "otherwise the logs are inserted synchronously before the response is returned. " +
    "Only available when `ENABLE_DUMMY_ENDPOINTS=true`.",
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({
      metricId: z.string().uuid().openapi({
        description: "ID of the metric to generate logs for",
        example: "55555555-eeee-4eee-8eee-000000000005",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: GenerateDummyMetricLogsRequestSchema,
        },
      },
    },
  },
  responses: {
    202: {
      description: "Job accepted — logs will be inserted by the worker",
      content: {
        "application/json": {
          schema: successEnvelope(GenerateDummyMetricLogsResponseSchema),
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    403: {
      $ref: "#/components/responses/ForbiddenError",
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
          schema: successEnvelope(MetricSettingsSchema),
        },
      },
    },
    400: {
      $ref: "#/components/responses/BadRequestError",
    },
    401: {
      $ref: "#/components/responses/UnauthorizedError",
    },
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricSettingsCursorResponseSchema),
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
          schema: successEnvelope(MetricSettingsSchema),
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
    409: {
      $ref: "#/components/responses/ConflictError",
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
          schema: successEnvelope(MetricSettingsSchema),
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
    200: {
      description: "Metric settings deleted successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
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
  path: "/metric-settings/{id}/achieve",
  tags: ["Metric Settings"],
  summary: "Toggle goal achievement for metric settings",
  security: [{ BearerAuth: [] }],
  request: {
    params: GetByIdParamSchema,
  },
  responses: {
    200: {
      description: "Goal achievement updated successfully",
      content: {
        "application/json": {
          schema: successEnvelope(MetricSettingsSchema),
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
          schema: successEnvelope(MetricDisplayOptionsSchema),
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
  },
  responses: {
    200: {
      description: "Trend data for the metric",
      content: {
        "application/json": {
          schema: successEnvelope(TrendResponseSchema),
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
          schema: successEnvelope(DashboardVisualizationResponseSchema),
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
          schema: successEnvelope(VisualizationResponseSchema),
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
  const generator = new OpenApiGeneratorV31(registry.definitions);
  // Generate a full OpenAPI document from the registry, seeded with the base config.
  const document = generator.generateDocument(openApiDocument);

  // Ensure we preserve and merge base components (securitySchemes, responses, etc.)
  // with any components generated from Zod schemas (schemas, parameters, ...).
  const baseComponents = (openApiDocument.components ?? {}) as ComponentsObject;
  const generatedComponents = (document.components ?? {}) as ComponentsObject;

  document.components = {
    ...baseComponents,
    ...generatedComponents,
    schemas: {
      ...(baseComponents.schemas ?? {}),
      ...(generatedComponents.schemas ?? {}),
    },
    responses: {
      ...(baseComponents.responses ?? {}),
      ...(generatedComponents.responses ?? {}),
    },
    securitySchemes: {
      ...(baseComponents.securitySchemes ?? {}),
      ...(generatedComponents.securitySchemes ?? {}),
    },
    parameters: {
      ...(baseComponents.parameters ?? {}),
      ...(generatedComponents.parameters ?? {}),
    },
  } as ComponentsObject;

  return document;
};
