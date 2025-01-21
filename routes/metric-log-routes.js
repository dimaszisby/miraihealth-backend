const express = require('express');
const router = express.Router();
const logController = require("../controllers/metric-log-controller");
const authMiddleware = require('../middleware/auth-middleware');

router.use(authMiddleware);

router.post('/:metricId/logs/', logController.createMetricLog);
router.get('/:metricId/logs/', logController.getAllLogsByMetric);
router.get('/:metricId/logs/:id', logController.getLogById);
router.put('/:metricId/logs/:id', logController.updateLog);
router.delete('/:metricId/logs/:id', logController.deletelog);

module.exports = router;