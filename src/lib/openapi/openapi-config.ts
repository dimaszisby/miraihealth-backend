import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { APP_NAME } from "@/config/app-name.js";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const registerSchema = registry.register.bind(registry);

export const registerPath = registry.registerPath.bind(registry);

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: `${APP_NAME} API`,
    version: "1.0.0",
    description: `API documentation for the ${APP_NAME} application.`,
  },
  servers: [
    {
      url: "/api/v1",
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "User authentication and authorization operations",
    },
    {
      name: "Metric Categories",
      description: "Operations related to metric categories",
    },
    {
      name: "Metrics",
      description: "Operations related to user metrics",
    },
    {
      name: "Metric Logs",
      description: "Operations related to logging metric data",
    },
    {
      name: "Metric Settings",
      description: "Operations related to user-specific metric settings",
    },
    {
      name: "Trends",
      description: "Operations related to data trends and analysis",
    },
    {
      name: "Analytics",
      description: "Visualization and dashboard analytics endpoints",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT authentication using a bearer token",
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Authentication required or invalid token",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "fail" },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      ForbiddenError: {
        description: "Access denied, insufficient permissions",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "fail" },
                message: { type: "string", example: "Forbidden" },
              },
            },
          },
        },
      },
      NotFoundError: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "fail" },
                message: { type: "string", example: "Resource not found" },
              },
            },
          },
        },
      },
      BadRequestError: {
        description: "Invalid request payload or parameters",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "fail" },
                message: { type: "string", example: "Bad Request" },
                errors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "array", items: { type: "string" } },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "error" },
                message: { type: "string", example: "Internal Server Error" },
              },
            },
          },
        },
      },
      ConflictError: {
        description: "Resource conflict (duplicate or already exists)",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "fail" },
                message: { type: "string", example: "Resource already exists" },
              },
            },
          },
        },
      },
    },
  },
};
