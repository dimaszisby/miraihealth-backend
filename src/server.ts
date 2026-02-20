import express, { Application } from "express";
import { env } from "./config/envManager.js";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import hpp from "hpp";
import http from "http";
import swaggerUi from "swagger-ui-express";
import { getOpenApiDocumentation } from "./lib/openapi/openapi-docs.js";
import logger from "@/utils/logger.js";

// Routes
import { authRouter } from "./features/auth/index.js";
import { metricRouter } from "./features/metric/index.js";
import { metricLogRouter } from "./features/metric-log/index.js";
import { metricSettingsRouter } from "./features/metric-settings/index.js";
import { metricCategoryRouter } from "./features/metric-category/index.js";
import { visualizationRouter } from "@/features/analytics/infrastructure/http/router.js";
import { buildMetricLogFeature } from "./features/metric-log/feature.js";
import { overrideMetricLogFeatureForTest } from "./features/metric-log/infrastructure/http/controller.js";
import { AnalyticsVisualizationInvalidationAdapter } from "./features/analytics/infrastructure/cache/VisualizationInvalidationAdapter.js";

// Other Setup
import { globalRateLimiter } from "@/shared/middleware/rate-limiter.js";
import { errorHandler } from "@/shared/middleware/error.js";
import { disconnectRedis } from "./utils/redis-client.js";
import sequelize from "./config/db.js";
import { loadModels } from "./infrastructure/db/models.js";
import { authMiddleware } from "./features/auth/infrastructure/http/authMiddleware.js";
import { disallowTraceMethod } from "@/shared/middleware/method-guard.js";

const visualizationInvalidationAdapter =
  new AnalyticsVisualizationInvalidationAdapter();
overrideMetricLogFeatureForTest(
  buildMetricLogFeature({
    visualizationInvalidator: visualizationInvalidationAdapter,
  }),
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
const initialDbBootstrap = async () => {
  if (!skipDbBootstrap) {
    loadModels();
    await sequelize.authenticate();
  } else {
    logger.info(
      "[SERVER] SKIP_DB_LIFECYCLE enabled — skipping initial DB bootstrap.",
    );
  }
};

const serverBootstrapPromise = initialDbBootstrap().catch((error) => {
  logger.error("[SERVER] Initial database bootstrap failed.", error);
  throw error;
});
export const serverReady = serverBootstrapPromise;

// * Environment Variables

const app: Application = express();

// * Middlewares
app.use(
  express.json({
    limit: env.REQUEST_BODY_LIMIT,
    strict: false, // allow primitives + guard downstream to emit cleaner 400s
  }),
);

// Security Enhancements
app.use(helmet()); // Secure HTTP headers
app.use(xssClean()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Disallow TRACE (and similar unsupported verbs) globally so contracts receive 405 responses.
app.use(disallowTraceMethod);

// Configure CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Allow cookies and auth headers
  }),
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

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

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
  swaggerUi.setup(openApiDocument),
);

// * Global Error Handler
app.use(errorHandler);

// HTTP Server Reference
let server: http.Server | null = null;

const startServer = async () => {
  try {
    const isTestEnv = env.NODE_ENV === "test";
    if (isTestEnv && !env.ALLOW_TEST_HTTP_SERVER) {
      logger.info(
        "[SERVER] Running in test environment with ALLOW_TEST_HTTP_SERVER=false. Server bootstrap skipped.",
      );
      return;
    }

    // Authenticate database connection
    await sequelize.authenticate();
    logger.info("[SERVER] Database connection established successfully.");

    // Start HTTP Server
    const PORT = env.PORT || 5000;
    server = app.listen(PORT, () => {
      logger.info(`[SERVER] Lakira backend running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("[SERVER ERROR] Server initialization failed:", error);
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
  logger.info(`\n[SERVER] Received ${signal}, initiating shutdown...`);

  try {
    if (server) {
      logger.info("[SERVER] Closing HTTP server...");
      await new Promise((resolve) => server!.close(resolve));
    }

    // Close database connection
    logger.info("[SERVER] Closing database connection...");
    await sequelize.close();

    // Close Redis connection
    logger.info("[SERVER] Closing Redis connection...");
    await disconnectRedis();

    logger.info("[SERVER] Cleanup completed. Exiting.");
    process.exit(0);
  } catch (error) {
    logger.error("[SERVER] during shutdown:", error);
    process.exitCode = 1;
  }
};

// Handle termination signals
["SIGTERM", "SIGINT"].forEach((signal) =>
  process.on(signal, () => shutdown(signal)),
);

// Handle uncaught exceptions and promise rejections
process.on("uncaughtException", (error) => {
  logger.error("[SERVER ERROR] Uncaught Exception:", error);
  shutdown("Uncaught Exception");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    "[SERVER ERROR] Unhandled Promise Rejection at:",
    promise,
    "reason:",
    reason,
  );
  shutdown("Unhandled Rejection");
});

startServer();

export default app;
