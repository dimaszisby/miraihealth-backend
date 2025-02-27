// src/server.ts

import express, { Application } from "express";
import { env } from "./config/zodEnv.js"; // Custom Environment Variables using Zod for setup
import db from "./models/index.js";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import hpp from "hpp";
import http from "http";

// Routes
import authRoutes from "./routes/auth.routes.js";
import metricRoutes from "./routes/metric-routes.js";
import metricCategoryRoutes from "./routes/metric-category-routes.js";
import metricSettingsRoutes from "./routes/metric-settings.routes.js";
import metricLogRoutes from "./routes/metric-log-routes.js";

// Other Setup
import { errorHandler } from "./middleware/error-handler.js";
import { disconnectRedis } from "./utils/redis-client.js";
// import { globalRateLimiter } from "./middleware/rate-limiter.js"; // Uncomment when needed

/**
 * * App Entry
 * Execution Flow:
 *  1. Load Env
 *  2. Initializes Middlewares
 *  3. Initializes Routes
 *  4. Initialize Global Error handler
 *  5. Start the server based on config/prompt
 */

// * Environment Variables

const app: Application = express();

// * Middlewares
app.use(express.json());

// Security Enhancements
app.use(helmet()); // Secure HTTP headers
app.use(xssClean()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Configure CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN || "http://localhost:3000", // Fallback if env variable is missing
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies and auth headers
  })
);

// Global Rate Limiter (Uncomment when needed)
// app.use(globalRateLimiter);

// * Routes
// Main Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/metrics", metricRoutes);
app.use("/api/v1/categories", metricCategoryRoutes);

// Nested Routes
app.use("/api/v1/metrics", metricSettingsRoutes);
app.use("/api/v1/metrics", metricLogRoutes);

// * Global Error Handler (Should be last middleware)
app.use(errorHandler);

// HTTP Server Reference
let server: http.Server | null = null;

// Helper function for checking test environment
const isTestEnv = (env: string): env is "test" => env === "test";

/**
 * 🚀 Initialize Server & Database Connection
 */
const startServer = async () => {
  try {
    if (env.NODE_ENV === "test") {
      console.log("🧪 Running in test environment. Server not started.");
      return;
    }

    // Authenticate database connection
    await db.sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Start HTTP Server
    const PORT = env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`🚀 MiraiHealth backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server initialization failed:", error);
    process.exit(1); // Exit if the server fails to start
  }
};

/**
 * 🔥 Graceful Shutdown Handling
 * - Capture SIGINT & SIGTERM (Docker, PM2, Kubernetes)
 * - Close DB connection
 * - Close Express server
 * - Log shutdown
 */
/**
 * 🔥 Graceful Shutdown Handling
 */
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, initiating shutdown...`);

  try {
    if (server) {
      console.log("🛑 Closing HTTP server...");
      await new Promise((resolve) => server!.close(resolve));
    }

    // Close database connection
    console.log("🛑 Closing database connection...");
    await db.sequelize.close();

    // Close Redis connection
    console.log("🛑 Closing Redis connection...");
    await disconnectRedis();

    console.log("✅ Cleanup completed. Exiting.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exitCode = 1;
  }
};

// Handle termination signals
["SIGTERM", "SIGINT"].forEach((signal) =>
  process.on(signal, () => shutdown(signal))
);

// Handle uncaught exceptions and promise rejections
process.on("uncaughtException", (error) => {
  console.error("🔥 Uncaught Exception:", error);
  shutdown("Uncaught Exception");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "🔥 Unhandled Promise Rejection at:",
    promise,
    "reason:",
    reason
  );
  shutdown("Unhandled Rejection");
});

// Start the server
startServer();

export default app;
