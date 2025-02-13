const express = require("express");
const router = express.Router();
const logController = require("../src/controllers/metric-log-controller");
const authMiddleware = require("../middleware/auth-middleware");
const validate = require("../middleware/validate");
const {
  createMetricLogSchema,
  updateMetricLogSchema,
  getAllMetricLogsSchema,
  getMetricLogSchema,
  deleteMetricLogSchema,
} = require("../validators/metric-log-validator");

router.use(authMiddleware);

// CREATE Log
router.post(
  "/:metricId/logs/",
  validate(createMetricLogSchema),
  logController.createMetricLog
);

// GET All Logs by Metric Id
router.get(
  "/:metricId/logs/",
  validate(getAllMetricLogsSchema),
  logController.getAllLogsByMetric
);

// GET Specific Log by Id
router.get(
  "/:metricId/logs/:id",
  validate(getMetricLogSchema),
  logController.getLogById
);

// UPDATE Log
router.put(
  "/:metricId/logs/:id",
  validate(updateMetricLogSchema),
  logController.updateLog
);

// DELETE Log
router.delete(
  "/:metricId/logs/:id",
  validate(getMetricLogSchema),
  logController.deletelog
);

module.exports = router;
