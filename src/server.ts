import express, { Application } from "express";
import { env } from "./config/zodEnv.js";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import hpp from "hpp";
import http from "http";
import swaggerUi from "swagger-ui-express";
import { getOpenApiDocumentation } from "./lib/openapi/openapi-docs.js";

// Routes
import { authRouter } from "./features/auth/index.js";
import { metricRouter } from "./features/metric/index.js";
import { metricLogRouter } from "./features/metric-log/index.js";
import { metricSettingsRouter } from "./features/metric-settings/index.js";
import { metricCategoryRouter } from "./features/metric-category/index.js";
import { visualizationRouter } from "@/features/analytics/infrastructure/http/router";
import { buildMetricLogFeature } from "./features/metric-log/feature.js";
import { overrideMetricLogFeatureForTest } from "./features/metric-log/infrastructure/http/controller.js";
import { AnalyticsVisualizationInvalidationAdapter } from "./features/analytics/infrastructure/cache/VisualizationInvalidationAdapter.js";

// Other Setup
import { globalRateLimiter } from "@/shared/middleware/rate-limiter";
import { errorHandler } from "@/shared/middleware/error";
import { disconnectRedis } from "./utils/redis-client.js";
import sequelize from "./config/db.js";
import { loadModels } from "./infrastructure/db/models.js";
import { authMiddleware } from "./features/auth/infrastructure/http/authMiddleware";

const visualizationInvalidationAdapter =
  new AnalyticsVisualizationInvalidationAdapter();
overrideMetricLogFeatureForTest(
  buildMetricLogFeature({
    visualizationInvalidator: visualizationInvalidationAdapter,
  })
);

/**
 * * App Entry
 * Execution Flow:
 *  1. Load Env
 *  2. Initializes Middlewares
 *  3. Initializes Routes
 *  4. Initialize Global Error handler
 *  5. Start the server based on config/prompt
 */

const skipDbBootstrap = process.env.SKIP_DB_LIFECYCLE === "true";
// * Sequelize
if (!skipDbBootstrap) {
  loadModels();
  await sequelize.authenticate();
} else {
  console.log("[SERVER] SKIP_DB_LIFECYCLE enabled — skipping initial DB bootstrap.");
}

// * Environment Variables

const app: Application = express();

// * Middlewares
app.use(
  express.json({
    limit: env.REQUEST_BODY_LIMIT,
  })
);

// Security Enhancements
app.use(helmet()); // Secure HTTP headers
app.use(xssClean()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Configure CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies and auth headers
  })
);

// Global Rate Limiter (Uncomment when needed)
app.use(globalRateLimiter);

// * Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/metrics", metricRouter);
app.use("/api/v1/metric-categories", metricCategoryRouter);
app.use("/api/v1/metric-settings", metricSettingsRouter);
app.use("/api/v1/metric-logs", metricLogRouter);
// DDD based routes
app.use("/api/v1/analytics", visualizationRouter);

// Serve OpenAPI documentation
// TODO: Developer Note -> Learn more about OpenAPI and Swagger integration
const openApiDocument = getOpenApiDocumentation();
const swaggerGuards = env.SWAGGER_REQUIRE_AUTH ? [authMiddleware] : [];

// Raw OpenAPI JSON endpoint for tooling/codegen
app.get("/api/v1/docs/openapi.json", ...swaggerGuards, (_req, res) => {
  res.json(openApiDocument);
});

app.use(
  "/api/v1/docs",
  ...swaggerGuards,
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument)
);

// * Global Error Handler
app.use(errorHandler);

// HTTP Server Reference
let server: http.Server | null = null;

// Helper function for checking test environment
const isTestEnv = (env: string): env is "test" => env === "test";

const startServer = async () => {
  try {
    if (env.NODE_ENV === "test") {
      console.log("[SERVER] Running in test environment. Server not started.");
      return;
    }

    // Authenticate database connection
    await sequelize.authenticate();
    console.log("[SERVER] Database connection established successfully.");

    // Start HTTP Server
    const PORT = env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`[SERVER] Lakira backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[SERVER ERROR] Server initialization failed:", error);
    process.exit(1); 
  }
};

/**
 * Graceful Shutdown Handling
 * - Capture SIGINT & SIGTERM (Docker, PM2, Kubernetes)
 * - Close DB connection
 * - Close Express server
 * - Log shutdown
 */
const shutdown = async (signal: string) => {
  console.log(`\n[SERVER] Received ${signal}, initiating shutdown...`);

  try {
    if (server) {
      console.log("[SERVER] Closing HTTP server...");
      await new Promise((resolve) => server!.close(resolve));
    }

    // Close database connection
    console.log("[SERVER] Closing database connection...");
    await sequelize.close();

    // Close Redis connection
    console.log("[SERVER] Closing Redis connection...");
    await disconnectRedis();

    console.log("[SERVER] Cleanup completed. Exiting.");
    process.exit(0);
  } catch (error) {
    console.error("[SERVER] during shutdown:", error);
    process.exitCode = 1;
  }
};

// Handle termination signals
["SIGTERM", "SIGINT"].forEach((signal) =>
  process.on(signal, () => shutdown(signal))
);

// Handle uncaught exceptions and promise rejections
process.on("uncaughtException", (error) => {
  console.error("[SERVER ERROR] Uncaught Exception:", error);
  shutdown("Uncaught Exception");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "[SERVER ERROR] Unhandled Promise Rejection at:",
    promise,
    "reason:",
    reason
  );
  shutdown("Unhandled Rejection");
});

startServer();

export default app;
