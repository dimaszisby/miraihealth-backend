// src/lib/openapi/openapi-schemas.ts

import { z } from "zod";
import { registerSchema } from "./openapi-config";

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

// Metric Schemas
export const MetricSchema = registerSchema(
  "Metric",
  z.object({
    id: UuidSchema,
    name: z.string().openapi({ example: "Daily Steps" }),
    description: z.string().optional().openapi({ example: "Number of steps walked per day" }),
    unit: z.string().openapi({ example: "steps" }),
    categoryId: UuidSchema.optional(),
    userId: UuidSchema,
    createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
  })
);

export const CreateMetricRequestSchema = registerSchema(
  "CreateMetricRequest",
  z.object({
    name: z.string().openapi({ example: "New Metric" }),
    description: z.string().optional().openapi({ example: "Description for new metric" }),
    unit: z.string().openapi({ example: "units" }),
    categoryId: UuidSchema.optional(),
  })
);

export const UpdateMetricRequestSchema = registerSchema(
  "UpdateMetricRequest",
  z.object({
    name: z.string().optional().openapi({ example: "Updated Metric Name" }),
    description: z.string().optional().openapi({ example: "Updated description" }),
    unit: z.string().optional().openapi({ example: "new units" }),
    categoryId: UuidSchema.optional(),
  })
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
    value: z.number().openapi({ example: 10000 }),
    notes: z.string().optional().openapi({ example: "Daily steps goal achieved" }),
    logDate: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    userId: UuidSchema,
    createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
  })
);

export const CreateMetricLogRequestSchema = registerSchema(
  "CreateMetricLogRequest",
  z.object({
    metricId: UuidSchema,
    value: z.number().openapi({ example: 5000 }),
    notes: z.string().optional().openapi({ example: "Halfway through the daily goal" }),
    logDate: z.string().datetime().openapi({ example: "2023-01-01T10:00:00Z" }),
  })
);

export const UpdateMetricLogRequestSchema = registerSchema(
  "UpdateMetricLogRequest",
  z.object({
    value: z.number().optional().openapi({ example: 12000 }),
    notes: z.string().optional().openapi({ example: "Exceeded daily steps goal" }),
    logDate: z.string().datetime().optional().openapi({ example: "2023-01-01T13:00:00Z" }),
  })
);

export const MetricLogListResponseSchema = registerSchema(
  "MetricLogListResponse",
  z.array(MetricLogSchema)
);

// Metric Settings Schemas
export const MetricSettingsSchema = registerSchema(
  "MetricSettings",
  z.object({
    id: UuidSchema,
    metricId: UuidSchema,
    goal: z.number().optional().openapi({ example: 10000 }),
    reminderFrequency: z.string().optional().openapi({ example: "daily" }),
    reminderTime: z.string().optional().openapi({ example: "08:00" }),
    userId: UuidSchema,
    createdAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2023-01-01T12:00:00Z" }),
  })
);

export const CreateMetricSettingsRequestSchema = registerSchema(
  "CreateMetricSettingsRequest",
  z.object({
    metricId: UuidSchema,
    goal: z.number().optional().openapi({ example: 15000 }),
    reminderFrequency: z.string().optional().openapi({ example: "weekly" }),
    reminderTime: z.string().optional().openapi({ example: "09:00" }),
  })
);

export const UpdateMetricSettingsRequestSchema = registerSchema(
  "UpdateMetricSettingsRequest",
  z.object({
    goal: z.number().optional().openapi({ example: 11000 }),
    reminderFrequency: z.string().optional().openapi({ example: "monthly" }),
    reminderTime: z.string().optional().openapi({ example: "10:00" }),
  })
);

export const MetricSettingsListResponseSchema = registerSchema(
  "MetricSettingsListResponse",
  z.array(MetricSettingsSchema)
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