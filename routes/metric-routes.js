const express = require('express');
const router = express.Router();
const metricController = require('../controllers/metric-controller');
const trendsController = require('../controllers/trend-controller');
const authMiddleware = require('../middleware/auth-middleware');

router.use(authMiddleware);

// Metrics Endpoints
router.post('/', metricController.createMetric);
router.get('/', metricController.getAllMetrics);
router.get('/:id', metricController.getMetricById);
router.put('/:id', metricController.updateMetric);
router.delete('/:id', metricController.deleteMetric);

// Trends Endpoint
router.get('/:metricId/trends', trendsController.getTrends);

module.exports = router;