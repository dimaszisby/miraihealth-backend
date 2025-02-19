// src/server.ts

import express, { Application } from "express";
import { env } from "./config/zodEnv.js"; // Custom Environment Variables using Zod for setup
import sequelize from "./config/db.js";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import xssClean from "xss-clean";
import hpp from "hpp";
import http from "http";

// Routes
import authRoutes from "./routes/auth-routes.js";
import metricRoutes from "./routes/metric-routes.js";
import metricCategoryRoutes from "./routes/metric-category-routes.js";
import metricSettingsRoutes from "./routes/metric-settings-routes.js";
import metricLogRoutes from "./routes/metric-log-routes.js";

// Other Setup

import { errorHandler } from "./middleware/error-handler.js";
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
dotenv.config();

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
    if (isTestEnv(env.NODE_ENV)) {
      console.log("🧪 Running in test environment. Server not started.");
      return;
    }

    // Authenticate database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Fetch database name for logging and debugging
    const [results]: any = await sequelize.query("SELECT current_database()");
    console.log(`📦 Connected to DB: ${results[0].current_database}`);

    // Start HTTP Server
    const PORT = env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`🚀 MiraiHealth backend running on port ${PORT}`);
    });

    // Log DATABASE_URL only if not in test
    console.log(
      "🔍 DATABASE_URL:",
      isTestEnv(env.NODE_ENV)
        ? env.TEST_DATABASE_URL
        : env.DEVELOPMENT_DATABASE_URL
    );
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
      await new Promise((resolve, reject) => {
        server!.close((err?: any) => (err ? reject(err) : resolve(true)));
      });
    }

    console.log("🛑 Closing database connection...");
    await sequelize.close();

    console.log("✅ Cleanup completed. Exiting.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exitCode = 1;
  }
};

// Handle termination signals
["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

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
