const authMiddleware = require("../middleware/auth-middleware");
const settingsController = require("../controllers/metric-settings-controller");
const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
  getAllMetricSettingsSchema,
  getMetricSettingsSchema,
  deleteMetricSettingsSchema,
} = require("../validators/metric-settings-validator");

router.use(authMiddleware);

// CREATE Settings
router.post(
  `/:metricId/settings/`,
  validate(createMetricSettingsSchema),
  settingsController.createMetricSettings
);

// GET All Settings by Metric Id
router.get(
  `/:metricId/settings/`,
  validate(getAllMetricSettingsSchema),
  settingsController.getAllMetricSettings
);

// GET specific Settings by Id
router.get(
  `/:metricId/settings/:id`,
  validate(getMetricSettingsSchema),
  settingsController.getMetricSettingsById
);

// Update Settings
router.put(
  `/:metricId/settings/:id`,
  validate(updateMetricSettingsSchema),
  settingsController.updateMetricSettings
);

// DELETE Settings
router.delete(
  `/:metricId/settings/:id`,
  validate(deleteMetricSettingsSchema),
  settingsController.deleteMetricSettings
);

module.exports = router;
