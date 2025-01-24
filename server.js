// server.js

// Internals
const express = require("express");
const sequelize = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");

// Security Middlewares
const helmet = require("helmet");
const xss = require("xss-clean"); // Additional security
const hpp = require("hpp"); // Prevent HTTP parameter pollution
const { globalRateLimiter } = require("./middleware/rate-limiter");

// Routes
const authRoutes = require("./routes/auth-routes");
const metricRoutes = require("./routes/metric-routes");
const metricCategoryRoutes = require("./routes/metric-category-routes");
const metricSettingsRoutes = require("./routes/metric-settings-routes");
const metricLogRoutes = require("./routes/metric-log-routes");

// other setups
const errorHandler = require("./middleware/error-handler");

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
const app = express();

// * Middlewares
app.use(express.json());

// Data Sanitization against XSS
// TODO: Extended implementations
app.use(xss());

// Prevent HTTP Parameter Pollution
// TODO: Extended implementations
app.use(hpp());

// TODO: Extended implementations
app.use(cors());

// Global Rate Limiter
app.use(globalRateLimiter);

// * Routes
// Main Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/metrics", metricRoutes);
app.use("/api/v1/categories", metricCategoryRoutes);

// Nested Routes
app.use("/api/v1/metrics", metricSettingsRoutes);
app.use("/api/v1/metrics", metricLogRoutes);

// * Global Error Handler
// Should be initialized after all midlewares and routes
app.use(errorHandler);

// * Server Mode Init
// Only authenticate and start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  sequelize
    .authenticate()
    .then(async () => {
      console.log("Connection has been established successfully.");

      // Find out which DB you’re really connected to
      const [results] = await sequelize.query("SELECT current_database()");
      console.log("Currently connected to DB:", results[0].current_database);
    })
    .catch((err) => {
      console.error("Unable to connect to the database:", err);
    });

  // Start Server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`MiraiHealth backend running on port ${PORT}`);
  });

  // Log DATABASE_URL only if not in test
  console.log(
    "DATABASE_URL:",
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL
  );
} else {
  // In test environment, avoid connecting and starting the server
  console.log("Running in test environment. Server not started.");
}

module.exports = app;
