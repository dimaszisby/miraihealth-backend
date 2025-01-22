const express = require("express");
const router = express.Router();
const metricController = require("../controllers/metric-controller");
const trendsController = require("../controllers/trend-controller");
const authMiddleware = require("../middleware/auth-middleware");
const validate = require("../middleware/validate");
const {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricByIdSchema,
} = require("../validators/metric-validator");

router.use(authMiddleware);

// * Metrics Endpoints
// CREATE
router.post("/", validate(createMetricSchema), metricController.createMetric);

// GET All by userId
router.get("/", metricController.getAllMetrics);

// GET by ID
router.get(
  "/:id",
  validate(getMetricByIdSchema),
  metricController.getMetricById
);

// UPDATE
router.put("/:id", validate(updateMetricSchema), metricController.updateMetric);

// DELETE
router.delete(
  "/:id",
  validate(deleteMetricSchema),
  metricController.deleteMetric
);

// * Trends Endpoint
router.get("/:metricId/trends", trendsController.getTrends);

module.exports = router;
