# Comprehensive Guide: OpenAPI 3.1.0 with `zod-to-openapi` in Node.js (Express.js)

This guide provides a step-by-step approach to generating a production-grade OpenAPI 3.1.0 specification for a RESTful API in a Node.js environment using `zod-to-openapi`. It covers project structure, Zod schema best practices, integration with Express.js, robust error handling, security definitions, serving the spec, and considerations for maintainability, testing, and CI/CD.

## 1. Introduction and Project Setup

### 1.1 What is OpenAPI?

OpenAPI Specification (OAS) defines a standard, language-agnostic interface to RESTful APIs, allowing both humans and computers to discover and understand the capabilities of a service without access to source code, documentation, or network traffic inspection.

### 1.2 Why `zod-to-openapi`?

`zod-to-openapi` is a library that bridges the gap between Zod schemas (for runtime validation) and OpenAPI schemas (for API documentation). By defining your API's data structures once with Zod, you can automatically generate both runtime validation and OpenAPI documentation, reducing redundancy and ensuring consistency.

### 1.3 Initial Project Setup

Assuming you have Node.js and npm/yarn installed:

```bash
# Initialize your project
npm init -y

# Install core dependencies
npm install express zod @asteasolutions/zod-to-openapi swagger-ui-express

# Install development dependencies (for TypeScript)
npm install -D typescript @types/node @types/express @types/swagger-ui-express
```

**`tsconfig.json` (example):**

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

## 2. Zod Schema Best Practices for API Validation

Organize your Zod schemas in a dedicated directory, e.g., `src/types/api/`. Each schema should represent a specific API entity or request/response structure.

### 2.1 Request Validation Schemas

Use `z.object()` to define schemas for request bodies, query parameters, path parameters, and headers.

**Example: `src/features/auth/infrastructure/http/schema.zod.ts`**

```typescript
import { z } from "zod";
import { ZOD_MESSAGES } from "../../constants/zod-messages"; // Assuming this file exists

// Schema for creating a new user (request body)
export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, ZOD_MESSAGES.MIN_LENGTH("Username", 3))
    .max(50, ZOD_MESSAGES.MAX_LENGTH("Username", 50)),
  email: z.string().email(ZOD_MESSAGES.INVALID_EMAIL),
  password: z.string().min(8, ZOD_MESSAGES.MIN_LENGTH("Password", 8)),
});

// Schema for fetching a user by ID (path parameters)
export const GetUserByIdParamsSchema = z.object({
  id: z.string().uuid(ZOD_MESSAGES.INVALID_UUID("User ID")),
});

// Schema for listing users (query parameters)
export const ListUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform(Number)
    .pipe(z.number().int().positive(ZOD_MESSAGES.POSITIVE_NUMBER("Page"))),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform(Number)
    .pipe(z.number().int().positive(ZOD_MESSAGES.POSITIVE_NUMBER("Limit"))),
  search: z.string().optional(),
});

// Schema for common headers (e.g., Authorization)
export const AuthHeadersSchema = z
  .object({
    authorization: z
      .string()
      .startsWith("Bearer ", ZOD_MESSAGES.INVALID_AUTH_HEADER),
  })
  .partial(); // Use .partial() if headers are optional for some routes
```

**`src/constants/zod-messages.ts` (example, based on existing file structure):**

```typescript
export const ZOD_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required.`,
  MIN_LENGTH: (field: string, min: number) =>
    `${field} must be at least ${min} characters long.`,
  MAX_LENGTH: (field: string, max: number) =>
    `${field} must be at most ${max} characters long.`,
  INVALID_EMAIL: "Invalid email address.",
  INVALID_UUID: (field: string) => `Invalid ${field} format.`,
  POSITIVE_NUMBER: (field: string) => `${field} must be a positive number.`,
  INVALID_AUTH_HEADER: 'Authorization header must start with "Bearer ".',
  // Add more custom messages as needed
};
```

### 2.2 Response Validation Schemas

Define schemas for the structure of your API responses. These can be used for both documentation and potentially for client-side validation or type generation.

**Example: `src/features/auth/infrastructure/http/schema.zod.ts` (continued)**

```typescript
// ... (previous schemas)

// Schema for a single user response
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schema for a list of users response
export const ListUsersResponseSchema = z.object({
  data: z.array(UserResponseSchema),
  total: z.number().int().positive(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
```

### 2.3 Reusability and Modularity

Break down complex schemas into smaller, reusable components. This improves readability and maintainability.

```typescript
// src/types/api/common.schema.ts
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

// src/types/api/zod-product.schema.ts
import { PaginationSchema } from "./common.schema";

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number().positive(),
});

export const ListProductsResponseSchema = z
  .object({
    data: z.array(ProductSchema),
  })
  .merge(PaginationSchema); // Merge common pagination fields
```

## 3. Integrating `zod-to-openapi` with Express.js

### 3.1 Setting up the OpenAPI Registry

Create a central registry to collect all your API paths and components.

**`src/openapi/registry.ts`**

```typescript
import {
  OpenApiBuilder,
  ZodOpenApiRegistry,
} from "@asteasolutions/zod-to-openapi";

export const registry = new ZodOpenApiRegistry();
export const openApiBuilder = new OpenApiBuilder(registry.definitions);

openApiBuilder.addInfo({
  title: "Lakira Backend API",
  version: "1.0.0",
  description: "API documentation for the Lakira Backend application.",
});

openApiBuilder.addExternalDocs({
  url: "https://example.com/docs",
  description: "Find more info here",
});

// Define common responses (e.g., 400 Bad Request, 401 Unauthorized, 500 Internal Server Error)
registry.registerComponent("responses", "BadRequest", {
  description: "Bad Request",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Invalid input data." },
          errors: {
            type: "array",
            items: { type: "string" },
            example: ['"username" is required'],
          },
        },
      },
    },
  },
});

registry.registerComponent("responses", "Unauthorized", {
  description: "Unauthorized",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Authentication required." },
        },
      },
    },
  },
});

registry.registerComponent("responses", "InternalServerError", {
  description: "Internal Server Error",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "An unexpected error occurred." },
        },
      },
    },
  },
});
```

### 3.2 Defining Routes with OpenAPI Metadata

Extend your Express.js routes to include OpenAPI metadata using `registry.registerPath()`.

**`src/routes/user.routes.ts` (example)**

```typescript
import { Router } from "express";
import { registry } from "../openapi/registry";
import {
  CreateUserSchema,
  GetUserByIdParamsSchema,
  UserResponseSchema,
  ListUsersQuerySchema,
  ListUsersResponseSchema,
} from "../types/api/auth schema";
import { validate } from "../middleware/validate"; // Custom validation middleware
import { AuthHeadersSchema } from "../types/api/auth schema"; // For security

const router = Router();

// Register path for creating a user
registry.registerPath({
  method: "post",
  path: "/users",
  summary: "Create a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
      description: "User data to create",
      required: true,
    },
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
    },
    400: { $ref: "#/components/responses/BadRequest" },
    500: { $ref: "#/components/responses/InternalServerError" },
  },
  tags: ["Users"],
});

router.post(
  "/",
  validate({ body: CreateUserSchema }), // Validate request body
  (req, res) => {
    // Controller logic to create user
    res.status(201).json({ message: "User created", user: req.body });
  },
);

// Register path for getting a user by ID
registry.registerPath({
  method: "get",
  path: "/users/{id}",
  summary: "Get user by ID",
  request: {
    params: GetUserByIdParamsSchema,
    headers: AuthHeadersSchema, // Example: requiring auth header
  },
  responses: {
    200: {
      description: "User details",
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
    },
    401: { $ref: "#/components/responses/Unauthorized" },
    404: { description: "User not found" },
    500: { $ref: "#/components/responses/InternalServerError" },
  },
  security: [{ bearerAuth: [] }], // Apply security scheme
  tags: ["Users"],
});

router.get(
  "/:id",
  validate({ params: GetUserByIdParamsSchema, headers: AuthHeadersSchema }), // Validate params and headers
  (req, res) => {
    // Controller logic to fetch user
    res.status(200).json({ message: `User with ID ${req.params.id}` });
  },
);

// Register path for listing users
registry.registerPath({
  method: "get",
  path: "/users",
  summary: "List all users",
  request: {
    query: ListUsersQuerySchema,
    headers: AuthHeadersSchema,
  },
  responses: {
    200: {
      description: "List of users",
      content: {
        "application/json": {
          schema: ListUsersResponseSchema,
        },
      },
    },
    401: { $ref: "#/components/responses/Unauthorized" },
    500: { $ref: "#/components/responses/InternalServerError" },
  },
  security: [{ bearerAuth: [] }],
  tags: ["Users"],
});

router.get(
  "/",
  validate({ query: ListUsersQuerySchema, headers: AuthHeadersSchema }),
  (req, res) => {
    // Controller logic to list users
    res.status(200).json({ data: [], total: 0, page: 1, limit: 10 });
  },
);

export default router;
```

### 3.3 Request Validation Middleware

Create a generic middleware to validate incoming requests against Zod schemas.

**`src/shared/middleware/validation.ts`**

```typescript
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, z } from "zod";
import AppError from "@/utils/AppError"; // Custom error class

interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
  headers?: AnyZodObject;
}

export const validate =
  (schemas: ValidationSchemas) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.headers) {
        // Headers are typically lowercased by Express, so normalize them
        const normalizedHeaders = Object.fromEntries(
          Object.entries(req.headers).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ]),
        );
        req.headers = await schemas.headers.parseAsync(normalizedHeaders);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(
          (err) => `${err.path.join(".")} - ${err.message}`,
        );
        return next(new AppError("Validation Error", 400, errors));
      }
      next(error); // Pass other errors to the general error handler
    }
  };
```

## 4. Robust Error Handling

Implement custom error classes and a centralized error handling middleware to provide consistent API error responses.

### 4.1 Custom Error Class

**`src/utils/AppError.ts`**

```typescript
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errors?: string[]; // Optional array for validation errors

  constructor(message: string, statusCode: number = 500, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Operational errors are those we can predict and handle
    this.errors = errors;

    Object.setPrototypeOf(this, AppError.prototype); // Correct prototype chain
  }
}
```

### 4.2 Centralized Error Handling Middleware

**`src/shared/middleware/error.ts`**

```typescript
import { Request, Response, NextFunction } from "express";
import AppError from "@/utils/AppError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors, // Include validation errors if present
    });
  }

  // For unexpected errors, log them and send a generic response
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};
```

### 4.3 Integrating Error Handling in `src/server.ts`

```typescript
import express from "express";
import userRoutes from "./routes/user.routes"; // Import your routes
import { errorHandler } from "./middleware/error-handler"; // Import error handler

const app = express();
app.use(express.json()); // Body parser

// API Routes
app.use("/api/v1/users", userRoutes);

// Catch-all for undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 5. Defining Security Schemes

OpenAPI allows you to define various security schemes. `zod-to-openapi` integrates with these definitions.

### 5.1 JWT (Bearer Token)

**`src/openapi/registry.ts` (continued)**

```typescript
// ... (previous registry setup)

openApiBuilder.addSecurityScheme("bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description:
    'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
});
```

Then, apply this security scheme to specific paths as shown in `src/routes/user.routes.ts`:

```typescript
// ...
registry.registerPath({
  // ...
  security: [{ bearerAuth: [] }], // This references the 'bearerAuth' scheme
  // ...
});
```

### 5.2 OAuth2 (Conceptual)

For OAuth2, you would define the flows.

**`src/openapi/registry.ts` (continued)**

```typescript
// ... (previous registry setup)

openApiBuilder.addSecurityScheme("OAuth2", {
  type: "oauth2",
  description: "OAuth2 authentication with implicit flow",
  flows: {
    implicit: {
      authorizationUrl: "https://example.com/oauth/authorize",
      scopes: {
        "read:users": "Read user profiles",
        "write:users": "Modify user profiles",
      },
    },
  },
});
```

And apply it similarly:

```typescript
// ...
registry.registerPath({
  // ...
  security: [{ OAuth2: ["read:users"] }], // Requesting 'read:users' scope
  // ...
});
```

## 6. Serving the OpenAPI Spec with Swagger UI

`swagger-ui-express` is a popular package to serve your OpenAPI JSON and a beautiful UI for it.

### 6.1 Generate OpenAPI JSON

Create a script to generate the OpenAPI JSON from your registry.

**`src/openapi/generate-openapi-spec.ts`**

```typescript
import { openApiBuilder, registry } from './registry';
import * as fs from 'fs';
import * as path from 'path';

// Import all your route files to ensure their paths are registered
import '../routes/user.routes';
// import '../routes/auth.routes'; // Add other routes as needed
// import '../routes/metric-category.routes'; // Example from your project structure

const spec = openApiBuilder.get  OpenApiDoc({
  // Optional: Customize OpenAPI version, etc.
  openapi: '3.1.0',
});

const outputPath = path.resolve(__dirname, '../../documents/openapi/lakira-backend-openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`OpenAPI spec written to ${outputPath}`);
```

Add a script to your `package.json` to run this:

```json
{
  "scripts": {
    "generate-openapi": "ts-node src/openapi/generate-openapi-spec.ts"
  }
}
```

Run `npm run generate-openapi` to create `documents/openapi/lakira-backend-openapi.json`.

### 6.2 Serve with Swagger UI

**`src/server.ts` (continued)**

```typescript
import express from "express";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "../documents/openapi/lakira-backend-openapi.json"; // Import the generated spec
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middleware/error-handler";
import { AppError } from "./utils/AppError";

const app = express();
app.use(express.json());

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use("/api/v1/users", userRoutes);

// Catch-all for undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
```

## 7. Considerations for Maintainability, Testing, and CI/CD

### 7.1 Maintainability

- **Modular Schemas**: Keep Zod schemas small and focused, organized by domain or resource.
- **Centralized Registry**: All OpenAPI definitions flow through a single registry, making it easy to manage.
- **Automated Generation**: Rely on `zod-to-openapi` to generate the spec, reducing manual errors.
- **Clear Tagging**: Use OpenAPI `tags` to group related endpoints in the documentation.
- **Descriptions and Summaries**: Provide meaningful `summary` and `description` for paths and schemas.

### 7.2 Testing

- **Unit Tests for Schemas**: Test your Zod schemas independently to ensure they validate data as expected.
- **Integration Tests for Endpoints**:
  - Test API endpoints to ensure they correctly handle valid and invalid inputs based on your Zod schemas.
  - Verify that error responses for validation failures conform to your defined error handling structure.
  - You can even use the generated OpenAPI spec to dynamically generate test cases or validate API responses against the spec.

### 7.3 CI/CD Pipelines

Integrate the OpenAPI generation process into your CI/CD pipeline:

1.  **Pre-commit Hook/Linting**: Ensure all Zod schemas are correctly defined and `zod-to-openapi` metadata is present.
2.  **Build Step**: Run `npm run generate-openapi` as part of your build process. This ensures the latest spec is always available.
3.  **Deployment**: The generated `lakira-backend-openapi.json` should be deployed alongside your application.
4.  **Documentation Hosting**: If you have a separate documentation portal, you can push the generated OpenAPI JSON to it.
5.  **API Gateway Integration**: The generated spec can be used to configure API gateways (e.g., AWS API Gateway, Azure API Management) for request validation, security, and routing.

By following this guide, you can establish a robust and maintainable system for API validation and documentation using Zod and `zod-to-openapi` in your Node.js Express.js applications.
