const express = require("express");
const sequelize = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth-routes");
const metricRoutes = require("./routes/metric-routes");
const metricCategoryRoutes = require("./routes/metric-category-routes");
const metricSettingsRoutes = require("./routes/metric-settings-routes");
const metricLogRoutes = require("./routes/metric-log-routes");

// Load environment variables
dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/metrics", metricRoutes);
app.use("/api/v1/categories", metricCategoryRoutes);

// Nested Routes for Metric Settings and Logs
app.use("/api/v1/metrics", metricSettingsRoutes);
app.use("/api/v1/metrics", metricLogRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!", error: err.message });
});

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
