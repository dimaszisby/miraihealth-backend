import { Router } from "express";
import {
  createMetricSettings,
  getAllMetricSettings,
  getMetricSettingsById,
  updateMetricSettings,
  deleteMetricSettings,
} from "../controllers/metric-settings-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
  getAllMetricSettingsSchema,
  getMetricSettingsSchema,
  deleteMetricSettingsSchema,
} from "../validators/metric-settings-validator.js";

const router = Router();

// * Apply Authentication Middleware Globally
router.use(authMiddleware);

// * Routes

// CREATE Settings
router.post(
  "/:metricId/settings/",
  validate(createMetricSettingsSchema),
  createMetricSettings
);

// GET All Settings by Metric Id
router.get(
  "/:metricId/settings/",
  validate(getAllMetricSettingsSchema),
  getAllMetricSettings
);

// GET Specific Settings by Id
router.get(
  "/:metricId/settings/:id",
  validate(getMetricSettingsSchema),
  getMetricSettingsById
);

// UPDATE Settings
router.put(
  "/:metricId/settings/:id",
  validate(updateMetricSettingsSchema),
  updateMetricSettings
);

// DELETE Settings
router.delete(
  "/:metricId/settings/:id",
  validate(deleteMetricSettingsSchema),
  deleteMetricSettings
);

export default router;
