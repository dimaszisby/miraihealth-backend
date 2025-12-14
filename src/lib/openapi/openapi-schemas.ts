import { z } from "zod";
import { registerSchema } from "./openapi-config";
import {
  listMetricQueryDocSchema,
  metricBody,
  metricBodyPartial,
  metricDetailQuery,
} from "@/features/metric/infrastructure/http/schema.zod";

// Common Schemas
export const UuidSchema = registerSchema(
  "Uuid",
  z.string().uuid().openapi({
    description: "A UUID identifier",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
);

export const ErrorSchema = registerSchema(
  "Error",
  z.object({
    status: z.string().openapi({ example: "fail" }),
    message: z.string().openapi({ example: "Error message" }),
  })
);

export const ValidationErrorSchema = registerSchema(
  "ValidationError",
  z.object({
    status: z.string().openapi({ example: "fail" }),
    message: z.string().openapi({ example: "Validation Error" }),
    errors: z.array(
      z.object({
        path: z.array(z.string()).openapi({ example: ["body", "email"] }),
        message: z.string().openapi({ example: "Invalid email format" }),
      })
    ),
  })
);

export const SuccessResponseSchema = registerSchema(
  "SuccessResponse",
  z.object({
    status: z.string().openapi({ example: "success" }),
    message: z.string().optional().openapi({ example: "Operation successful" }),
    data: z.any().optional().openapi({ description: "Response data" }),
  })
);

const queryParamMetadata = (
  name: string,
  description: string,
  required = false
) => ({
  param: {
    name,
    in: "query" as const,
    required,
    description,
  },
});

export const MetricIdQuerySchema = registerSchema(
  "MetricIdQuery",
  z.object({
    metricId: UuidSchema.optional().openapi(
      queryParamMetadata(
        "metricId",
        "Optional metric identifier to scope the request"
      )
    ),
  })
);

export const MetricIdRequiredQuerySchema = registerSchema(
  "MetricIdRequiredQuery",
  z.object({
    metricId: UuidSchema.openapi(
      queryParamMetadata(
        "metricId",
        "Metric identifier required for ownership validation",
        true
      )
    ),
  })
);

const cursorLimitParam = queryParamMetadata(
  "limit",
  "Maximum number of records to return (1-100)"
);

const cursorSortParam = (
  name = "sort",
  description = "Sort field (prefix with - for DESC)"
) => queryParamMetadata(name, description);

const cursorAfterParam = queryParamMetadata(
  "after",
  "Opaque cursor returned from the previous page"
);

const cursorIncludeTotalParam = queryParamMetadata(
  "includeTotal",
  "Set to true to include totalCount in the response"
);

const cursorSearchParam = queryParamMetadata(
  "q",
  "Optional free-text search term"
);

export const MetricCursorQueryParamsSchema = registerSchema(
  "MetricCursorQueryParams",
  listMetricQueryDocSchema
);

export const MetricCategoryCursorQueryParamsSchema = registerSchema(
  "MetricCategoryCursorQueryParams",
  z.object({
    limit: z.number().int().min(1).max(100).optional().openapi(cursorLimitParam),
    sort: z
      .enum([
        "createdAt",
        "-createdAt",
        "updatedAt",
        "-updatedAt",
        "name",
        "-name",
        "metricCount",
        "-metricCount",
      ] as const)
      .optional()
      .openapi(cursorSortParam()),
    q: z.string().optional().openapi(cursorSearchParam),
    after: z.string().optional().openapi(cursorAfterParam),
    includeTotal: z.boolean().optional().openapi(cursorIncludeTotalParam),
    ["filter[name]"]: z
      .string()
      .optional()
      .openapi(queryParamMetadata("filter[name]", "Filter categories by name")),
  })
);

export const MetricLogCursorQueryParamsSchema = registerSchema(
  "MetricLogCursorQueryParams",
  z.object({
    limit: z.number().int().min(1).max(100).optional().openapi(cursorLimitParam),
    sort: z
      .enum([
        "createdAt",
        "-createdAt",
        "updatedAt",
        "-updatedAt",
        "logValue",
        "-logValue",
        "loggedAt",
        "-loggedAt",
      ] as const)
      .optional()
      .openapi(cursorSortParam()),
    q: z
      .string()
      .optional()
      .openapi(
        queryParamMetadata(
          "q",
          "Optional search term applied to log notes/metadata"
        )
      ),
    after: z.string().optional().openapi(cursorAfterParam),
    includeTotal: z.boolean().optional().openapi(cursorIncludeTotalParam),
    ["filter[metricId]"]: UuidSchema.optional().openapi(
      queryParamMetadata("filter[metricId]", "Filter logs by metric identifier")
    ),
    ["filter[logValue]"]: z
      .number()
      .optional()
      .openapi(
        queryParamMetadata(
          "filter[logValue]",
          "Filter logs by an exact log value"
        )
      ),
  })
);

export const MetricSettingsCursorQueryParamsSchema = registerSchema(
  "MetricSettingsCursorQueryParams",
  z.object({
    limit: z.number().int().min(1).max(100).optional().openapi(cursorLimitParam),
    sort: z
      .enum(["createdAt", "-createdAt", "updatedAt", "-updatedAt", "isActive", "-isActive"] as const)
      .optional()
      .openapi(cursorSortParam()),
    q: z.string().optional().openapi(cursorSearchParam),
    after: z.string().optional().openapi(cursorAfterParam),
    includeTotal: z.boolean().optional().openapi(cursorIncludeTotalParam),
    ["filter[metricId]"]: UuidSchema.optional().openapi(
      queryParamMetadata(
        "filter[metricId]",
        "Filter settings by metric identifier"
      )
    ),
    ["filter[isActive]"]: z
      .boolean()
      .optional()
      .openapi(
        queryParamMetadata("filter[isActive]", "Filter settings by active status")
      ),
  })
);

// Auth Schemas
export const LoginRequestSchema = registerSchema(
  "LoginRequest",
  z.object({
    email: z.string().email().openapi({ example: "user@example.com" }),
    password: z.string().min(6).openapi({ example: "password123" }),
  })
);

export const LoginResponseSchema = registerSchema(
  "LoginResponse",
  z.object({
    status: z.string().openapi({ example: "success" }),
    message: z.string().openapi({ example: "Login successful" }),
    token: z.string().openapi({
      example:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
    user: z.object({
      id: UuidSchema,
      username: z.string().openapi({ example: "testuser" }),
      email: z.string().email().openapi({ example: "test@example.com" }),
      isPublicProfile: z.boolean().openapi({ example: true }),
      role: z.enum(["user", "admin"]).openapi({ example: "user" }),
      createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
      updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    }),
  })
);

export const RegisterRequestSchema = registerSchema(
  "RegisterRequest",
  z.object({
    username: z.string().min(3).openapi({ example: "newuser" }),
    email: z.string().email().openapi({ example: "newuser@example.com" }),
    password: z.string().min(6).openapi({ example: "newpassword123" }),
    passwordConfirmation: z.string().min(6).openapi({ example: "newpassword123" }),
    isPublicProfile: z.boolean().optional().default(true).openapi({ example: true }),
    role: z.enum(["user", "admin"]).optional().default("user").openapi({ example: "user" }),
  }).refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  })
);

export const UserResponseSchema = registerSchema(
  "UserResponse",
  z.object({
    id: UuidSchema,
    username: z.string().openapi({ example: "testuser" }),
    email: z.string().email().openapi({ example: "test@example.com" }),
    isPublicProfile: z.boolean().openapi({ example: true }),
    role: z.enum(["user", "admin"]).openapi({ example: "user" }),
    createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
  })
);

export const UpdateUserRequestSchema = registerSchema(
  "UpdateUserRequest",
  z.object({
    username: z.string().min(3).optional().openapi({ example: "updateduser" }),
    email: z.string().email().optional().openapi({ example: "updated@example.com" }),
    password: z.string().min(6).optional().openapi({ example: "updatedpassword" }),
    isPublicProfile: z.boolean().optional().openapi({ example: false }),
    role: z.enum(["user", "admin"]).optional().openapi({ example: "admin" }),
  })
);

// Metric Category Schemas
export const MetricCategorySchema = registerSchema(
  "MetricCategory",
  z.object({
    id: UuidSchema,
    name: z.string().openapi({ example: "Fitness" }),
    color: z.string().openapi({ example: "#FF5733" }),
    icon: z.string().openapi({ example: "🏃" }),
    userId: UuidSchema,
    metricCount: z.number().openapi({ example: 4 }),
    createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
  })
);

export const CreateMetricCategoryRequestSchema = registerSchema(
  "CreateMetricCategoryRequest",
  z.object({
    name: z.string().openapi({ example: "New Category" }),
    color: z.string().openapi({ example: "#123456" }),
    icon: z.string().openapi({ example: "✨" }),
  })
);

export const UpdateMetricCategoryRequestSchema = registerSchema(
  "UpdateMetricCategoryRequest",
  z.object({
    name: z.string().optional().openapi({ example: "Updated Category Name" }),
    color: z.string().optional().openapi({ example: "#654321" }),
    icon: z.string().optional().openapi({ example: "🌟" }),
  })
);

export const MetricCategoryListResponseSchema = registerSchema(
  "MetricCategoryListResponse",
  z.array(MetricCategorySchema)
);

const CursorMetaSchema = {
  nextCursor: z
    .string()
    .nullable()
    .openapi({ example: "eyJpZCI6IjEyMyJ9", description: "Opaque cursor for the next page" }),
  sort: z
    .string()
    .openapi({ example: "-createdAt", description: "Sort applied to the collection" }),
  limit: z
    .number()
    .int()
    .openapi({ example: 20, description: "Page size used in the request" }),
  q: z
    .string()
    .optional()
    .openapi({ example: "sleep", description: "Search term applied, if any" }),
  filter: z
    .record(z.any())
    .optional()
    .openapi({ description: "Normalized filters applied to the query" }),
  totalCount: z
    .number()
    .optional()
    .openapi({
      example: 120,
      description: "Total number of records (present only when includeTotal=true)",
    }),
};

const MetricPreviewCategorySchema = z.object({
  id: UuidSchema,
  name: z.string().openapi({ example: "Health" }),
  icon: z.string().openapi({ example: "❤️" }),
  color: z.string().openapi({ example: "#FF0000" }),
});

export const MetricPreviewSchema = registerSchema(
  "MetricPreview",
  z.object({
    id: UuidSchema,
    name: z.string().openapi({ example: "Sleep Hours" }),
    description: z.string().nullable().openapi({ example: "Hours slept per day" }),
    defaultUnit: z.string().openapi({ example: "hours" }),
    isPublic: z.boolean().openapi({ example: false }),
    goalType: z.string().openapi({ example: "Not Set" }),
    logCount: z.number().openapi({ example: 42 }),
    category: MetricPreviewCategorySchema.nullable(),
  })
);

export const MetricCursorResponseSchema = registerSchema(
  "MetricCursorResponse",
  z.object({
    items: z.array(MetricPreviewSchema),
    ...CursorMetaSchema,
  })
);

export const MetricDetailQueryParamsSchema = registerSchema(
  "MetricDetailQueryParams",
  metricDetailQuery
);

export const MetricCategoryCursorResponseSchema = registerSchema(
  "MetricCategoryCursorResponse",
  z.object({
    items: z.array(MetricCategorySchema),
    ...CursorMetaSchema,
  })
);

// Metric Schemas
export const MetricSchema = registerSchema(
  "Metric",
  z.object({
    id: UuidSchema,
    userId: UuidSchema,
    originalMetricId: UuidSchema.optional().nullable(),
    categoryId: UuidSchema.optional().nullable(),
    name: z.string().openapi({ example: "Daily Steps" }),
    description: z.string().optional().nullable().openapi({ example: "Number of steps walked per day" }),
    defaultUnit: z.string().openapi({ example: "steps" }),
    isPublic: z.boolean().openapi({ example: false }),
    createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
  })
);

export const CreateMetricRequestSchema = registerSchema(
  "CreateMetricRequest",
  metricBody
);

export const UpdateMetricRequestSchema = registerSchema(
  "UpdateMetricRequest",
  metricBodyPartial
);

export const MetricListResponseSchema = registerSchema(
  "MetricListResponse",
  z.array(MetricSchema)
);

// Metric Log Schemas
export const MetricLogSchema = registerSchema(
  "MetricLog",
  z.object({
    id: UuidSchema,
    metricId: UuidSchema,
    type: z.enum(["manual", "automatic"]).openapi({ example: "manual" }),
    logValue: z.number().openapi({ example: 10000 }),
    loggedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
  })
);

export const CreateMetricLogRequestSchema = registerSchema(
  "CreateMetricLogRequest",
  z.object({
    metricId: UuidSchema,
    logValue: z.number().openapi({ example: 5000 }),
    type: z.enum(["manual", "automatic"]).optional().openapi({ example: "manual" }),
    loggedAt: z.string().datetime().optional().openapi({ example: "2023-01-01T10:00:00Z" }),
  })
);

export const UpdateMetricLogRequestSchema = registerSchema(
  "UpdateMetricLogRequest",
  z.object({
    logValue: z.number().optional().openapi({ example: 12000 }),
    type: z.enum(["manual", "automatic"]).optional().openapi({ example: "manual" }),
    loggedAt: z.string().datetime().optional().openapi({ example: "2023-01-01T13:00:00Z" }),
  })
);

export const MetricLogListResponseSchema = registerSchema(
  "MetricLogListResponse",
  z.array(MetricLogSchema)
);

export const MetricLogStatsResponseSchema = registerSchema(
  "MetricLogStatsResponse",
  z.object({
    average: z.number().openapi({ example: 80 }),
    min: z.number().openapi({ example: 10 }),
    max: z.number().openapi({ example: 150 }),
  })
);

export const MetricLogCursorResponseSchema = registerSchema(
  "MetricLogCursorResponse",
  z.object({
    items: z.array(MetricLogSchema),
    ...CursorMetaSchema,
  })
);

// Metric Settings Schemas
const MetricDisplayOptionsSchema = z.object({
  showOnDashboard: z.boolean().openapi({ example: true }),
  priority: z.number().nullable().openapi({ example: 1 }),
  chartType: z.string().nullable().openapi({ example: "line" }),
  color: z.string().nullable().openapi({ example: "#E897A3" }),
});

export const MetricSettingsSchema = registerSchema(
  "MetricSettings",
  z.object({
    id: UuidSchema,
    metricId: UuidSchema,
    isActive: z.boolean().openapi({ example: true }),
    goalEnabled: z.boolean().openapi({ example: true }),
    goalType: z.enum(["cumulative", "incremental"]).nullable().openapi({ example: "cumulative" }),
    goalValue: z.number().nullable().openapi({ example: 10000 }),
    timeFrameEnabled: z.boolean().openapi({ example: false }),
    startDate: z.string().datetime().nullable().openapi({ example: "2023-01-01T00:00:00Z" }),
    deadlineDate: z.string().datetime().nullable().openapi({ example: "2023-02-01T00:00:00Z" }),
    alertEnabled: z.boolean().openapi({ example: false }),
    alertThresholds: z.number().nullable().openapi({ example: 80 }),
    isAchieved: z.boolean().openapi({ example: false }),
    displayOptions: MetricDisplayOptionsSchema,
    createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
  })
);

export const CreateMetricSettingsRequestSchema = registerSchema(
  "CreateMetricSettingsRequest",
  z.object({
    metricId: UuidSchema,
    goalEnabled: z.boolean().optional().openapi({ example: true }),
    goalType: z.enum(["cumulative", "incremental"]).nullable().optional(),
    goalValue: z.number().nullable().optional(),
    timeFrameEnabled: z.boolean().optional(),
    startDate: z.string().datetime().nullable().optional(),
    deadlineDate: z.string().datetime().nullable().optional(),
    alertEnabled: z.boolean().optional(),
    alertThresholds: z.number().nullable().optional(),
    displayOptions: MetricDisplayOptionsSchema.partial().optional(),
  })
);

export const UpdateMetricSettingsRequestSchema = registerSchema(
  "UpdateMetricSettingsRequest",
  z.object({
    goalEnabled: z.boolean().optional(),
    goalType: z.enum(["cumulative", "incremental"]).nullable().optional(),
    goalValue: z.number().nullable().optional(),
    timeFrameEnabled: z.boolean().optional(),
    startDate: z.string().datetime().nullable().optional(),
    deadlineDate: z.string().datetime().nullable().optional(),
    alertEnabled: z.boolean().optional(),
    alertThresholds: z.number().nullable().optional(),
    displayOptions: MetricDisplayOptionsSchema.partial().optional(),
  })
);

export const UpdateDisplayOptionsRequestSchema = registerSchema(
  "UpdateDisplayOptionsRequest",
  z.object({
    displayOptions: MetricDisplayOptionsSchema.partial().openapi({
      example: {
        showOnDashboard: true,
        priority: 2,
        chartType: "bar",
        color: "#00FFAA",
      },
    }),
  })
);

export const MetricSettingsListResponseSchema = registerSchema(
  "MetricSettingsListResponse",
  z.array(MetricSettingsSchema)
);

export const MetricSettingsCursorResponseSchema = registerSchema(
  "MetricSettingsCursorResponse",
  z.object({
    items: z.array(MetricSettingsSchema),
    ...CursorMetaSchema,
  })
);

export const MetricDetailResponseSchema = registerSchema(
  "MetricDetailResponse",
  MetricSchema.extend({
    category: MetricCategorySchema.nullable(),
    settings: MetricSettingsSchema.nullable(),
    logs: z.array(MetricLogSchema).nullable(),
  })
);

// Trend Schemas
export const TrendDataPointSchema = registerSchema(
  "TrendDataPoint",
  z.object({
    date: z.string().openapi({ example: "2023-01-01" }),
    value: z.number().openapi({ example: 7500 }),
  })
);

export const TrendResponseSchema = registerSchema(
  "TrendResponse",
  z.object({
    metricId: UuidSchema,
    trend: z.array(TrendDataPointSchema),
  })
);

export const GetTrendRequestSchema = registerSchema(
  "GetTrendRequest",
  z.object({
    params: z.object({
      metricId: UuidSchema,
    }),
    query: z.object({
      startDate: z.string().datetime().optional().openapi({ example: "2023-01-01T00:00:00Z" }),
      endDate: z.string().datetime().optional().openapi({ example: "2023-01-31T23:59:59Z" }),
      interval: z.enum(["daily", "weekly", "monthly"]).optional().openapi({ example: "daily" }),
    }),
  })
);

// Analytics Schemas
const VisualizationSeriesSchema = z.object({
  bucketStartISO: z.string().datetime().openapi({ example: "2023-01-01T00:00:00Z" }),
  value: z.number().nullable().openapi({ example: 42.5 }),
});

const VisualizationStatsSchema = z.object({
  average: z.number().nullable().openapi({ example: 35.1 }),
  min: z.number().nullable().openapi({ example: 5 }),
  max: z.number().nullable().openapi({ example: 80 }),
  count: z.number().openapi({ example: 120 }),
});

const VisualizationMetaSchema = z.object({
  metricId: UuidSchema,
  unit: z.string().openapi({ example: "steps" }),
  bucket: z.string().openapi({ example: "1d" }),
  tz: z.string().openapi({ example: "Asia/Jakarta" }),
  range: z.object({
    startISO: z.string().datetime(),
    endISO: z.string().datetime(),
  }),
});

export const VisualizationResponseSchema = registerSchema(
  "VisualizationResponse",
  z.object({
    series: z.array(VisualizationSeriesSchema),
    stats: VisualizationStatsSchema,
    meta: VisualizationMetaSchema,
  })
);

const DashboardVisualizationItemSchema = z.object({
  metricId: UuidSchema,
  name: z.string().openapi({ example: "Sleep" }),
  unit: z.string().openapi({ example: "hours" }),
  category_name: z.string().nullable().openapi({ example: "Wellness" }),
  category_icon: z.string().nullable().openapi({ example: "😴" }),
  category_color: z.string().nullable().openapi({ example: "#663399" }),
  priority: z.number().nullable().openapi({ example: 1 }),
  series: z.array(VisualizationSeriesSchema),
  stats: VisualizationStatsSchema,
});

export const DashboardVisualizationResponseSchema = registerSchema(
  "DashboardVisualizationResponse",
  z.object({
    items: z.array(DashboardVisualizationItemSchema),
    meta: z.object({
      bucket: z.string().openapi({ example: "1d" }),
      tz: z.string().openapi({ example: "Asia/Jakarta" }),
      range: z.object({
        startISO: z.string().datetime(),
        endISO: z.string().datetime(),
      }),
      count: z.number().openapi({ example: 5 }),
    }),
  })
);

const BucketEnumSchema = z.enum(["1h", "1d", "1w", "1m", "1y"]);
const FillEnumSchema = z.enum(["none", "zero", "nan"]);

export const VisualizationQueryParamsSchema = registerSchema(
  "VisualizationQueryParams",
  z.object({
    bucket: BucketEnumSchema.optional().openapi({
      param: {
        name: "bucket",
        in: "query",
        required: false,
        description: "Aggregation bucket size",
      },
    }),
    tz: z.string().optional().openapi({
      param: {
        name: "tz",
        in: "query",
        required: false,
        description: "IANA timezone (e.g. Asia/Jakarta)",
      },
    }),
    fill: FillEnumSchema.optional().openapi({
      param: {
        name: "fill",
        in: "query",
        required: false,
        description: "Missing bucket fill strategy",
      },
    }),
    start: z.string().datetime().optional().openapi({
      param: {
        name: "start",
        in: "query",
        required: false,
        description: "Absolute start ISO timestamp",
      },
    }),
    end: z.string().datetime().optional().openapi({
      param: {
        name: "end",
        in: "query",
        required: false,
        description: "Absolute end ISO timestamp",
      },
    }),
    last: z.string().optional().openapi({
      param: {
        name: "last",
        in: "query",
        required: false,
        description: "Relative range such as 7d or 12m",
      },
    }),
  })
);

export const DashboardVisualizationQueryParamsSchema = registerSchema(
  "DashboardVisualizationQueryParams",
  VisualizationQueryParamsSchema.extend({
    limit: z.number().int().min(1).max(48).optional().openapi({
      param: {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum number of metrics to include",
      },
    }),
  })
);
