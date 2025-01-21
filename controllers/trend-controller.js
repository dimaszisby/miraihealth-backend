const { MetricLog, Metric } = require('../models');
const { Op } = require('sequelize');

// Get trend data for a specific metric
exports.getTrends = async (req, res) => {
  const { metricId } = req.params;
  
  try {
    const metric = await Metric.findOne({ where: { id: metricId, userId: req.user.id } });
    if (!metric) return res.status(404).json({ message: 'Metric not found' });
    
    // Example: Get logs for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const logs = await MetricLog.findAll({
      where: {
        metricId,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      order: [['createdAt', 'ASC']],
    });
    
    // Prepare trend data
    const trendData = logs.map(log => ({
      date: log.createdAt,
      value: log.targetValue,
    }));
    
    res.status(200).json(trendData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
