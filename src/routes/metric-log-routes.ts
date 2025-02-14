import { Router } from "express";
import {
  createMetricLog,
  getAllLogsByMetric,
  getLogById,
  updateLog,
  deleteLog,
} from "../controllers/metric-log-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createMetricLogSchema,
  updateMetricLogSchema,
  getAllMetricLogsSchema,
  getMetricLogSchema,
  deleteMetricLogSchema,
} from "../validators/metric-log-validator.js";

const router = Router();

// * Apply Authentication Middleware for all metric log routes
router.use(authMiddleware);

// * Routes

// CREATE Log
router.post(
  "/:metricId/logs/",
  validate(createMetricLogSchema),
  createMetricLog
);

// GET All Logs by Metric Id
router.get(
  "/:metricId/logs/",
  validate(getAllMetricLogsSchema),
  getAllLogsByMetric
);

// GET Specific Log by Id
router.get("/:metricId/logs/:id", validate(getMetricLogSchema), getLogById);

// UPDATE Log
router.put("/:metricId/logs/:id", validate(updateMetricLogSchema), updateLog);

// DELETE Log
router.delete("/:metricId/logs/:id", validate(deleteMetricLogSchema), deleteLog);

export default router;
