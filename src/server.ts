// src/server.ts

import express, { Application } from "express";
import sequelize from "./config/db.js";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import xssClean from "xss-clean";
import hpp from "hpp";

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
    origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Fallback if env variable is missing
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

// * Server Mode Init
// Avoid server initialization in test environment
if (process.env.NODE_ENV !== "test") {
  sequelize
    .authenticate()
    .then(async () => {
      console.log("✅ Database connection established successfully.");

      // Find out which DB you’re really connected to
      const [results]: any = await sequelize.query("SELECT current_database()");
      console.log(
        `📦 Currently connected to DB: ${results[0].current_database}`
      );
    })
    .catch((err) => {
      console.error("❌ Unable to connect to the database:", err);
    });

  // Start Server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 MiraiHealth backend running on port ${PORT}`);
  });

  // Log DATABASE_URL only if not in test
  console.log(
    "🔍 DATABASE_URL:",
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DATABASE_URL
      : process.env.DEVELOPMENT_DATABASE_URL
  );
} else {
  console.log("🧪 Running in test environment. Server not started.");
}

export default app;
