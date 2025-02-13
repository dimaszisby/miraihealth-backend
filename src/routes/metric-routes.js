const express = require("express");
const router = express.Router();
const metricController = require("../src/controllers/metric-controller");
const trendsController = require("../src/controllers/trend-controller");
const authMiddleware = require("../middleware/auth-middleware");
const cacheMiddleware = require("../middleware/cache-middleware");
const validate = require("../middleware/validate");
const {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricByIdSchema,
} = require("../validators/metric-validator");

router.use(authMiddleware);

/**
 * * Key Generator Function
 * Customize the key based on request parameters or user
 */
const metricsCacheKey = (req) => `metrics:${req.user.id}`;

// * Metrics Endpoints
// CREATE Metric
router.post("/", validate(createMetricSchema), metricController.createMetric);

// GET All Metric by User Id
router.get("/", metricController.getAllMetrics);

// GET specific Metric by ID
router.get(
  "/:id",
  validate(getMetricByIdSchema),
  cacheMiddleware(metricsCacheKey, 300), // Cache for 5 minutes
  metricController.getMetricById
);

// UPDATE Metric
router.put("/:id", validate(updateMetricSchema), metricController.updateMetric);

// DELETE Metric
router.delete(
  "/:id",
  validate(deleteMetricSchema),
  metricController.deleteMetric
);

// * Trends Endpoint
router.get("/:metricId/trends", trendsController.getTrends);

module.exports = router;
