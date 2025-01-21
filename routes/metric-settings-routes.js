const authMiddleware = require("../middleware/auth-middleware");
const settingsController = require("../controllers/metric-settings-controller");
const express = require("express");

const router = express.Router();
router.use(authMiddleware);

router.post(`/:metricId/settings/`, settingsController.createMetricSettings);
router.get(`/:metricId/settings/`, settingsController.getAllMetricSettings);
router.get(`/:metricId/settings/:id`, settingsController.getMetricSettingsById);
router.put(`/:metricId/settings/:id`, settingsController.updateMetricSettings);
router.delete(
  `/:metricId/settings/:id`,
  settingsController.deleteMetricSettings
);

module.exports = router;
