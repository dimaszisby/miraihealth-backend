const { MetricLog, Metric } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { where } = require("sequelize");

exports.createMetricLog = async (req, res) => {
  const metricId = req.params.metricId;
  const { type, logValue } = req.body;

  console.log(
    `Received request to create MetricLog with metricId: ${metricId}`
  );
  console.log(`Request Body:`, req.body);

  if (!metricId) {
    return res.status(400).json({ message: "metricId is required in the URL" });
  }

  if (!type || !logValue) {
    return res.status(400).json({
      message: "Both 'type' and 'logValue' are required in the body",
    });
  }

  try {
    // Verify that the parent Metric exists
    const metric = await Metric.findOne({ where: { id: metricId } });
    if (!metric) {
      return res.status(404).json({ message: "Parent Metric not found" });
    }

    const log = await MetricLog.create({
      metricId: metric.id,
      type,
      logValue,
    });

    res.status(201).json({ message: "Metric Log created successfully", log });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllLogsByMetric = async (req, res) => {
  const metricId = req.params.metricId;

  try {
    const logs = await MetricLog.findAll({
      where: { metricId: metricId },
    });

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getLogById = async (req, res) => {
  const { id, metricId } = req.params;

  try {
    const log = await MetricLog.findOne({
      where: { id: id, metricId: metricId },
    });

    res.status(200).json({ log });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateLog = async (req, res) => {
  const { id, metricId } = req.params;
  const { logValue, type } = req.body;

  try {
    const log = await MetricLog.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!log) return status(500).json({ message: "Log Not Found" });

    await log.update({ logValue, type });

    res.status(200).json({ message: "Log updated successfully", log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletelog = async (req, res) => {
  const { id, metricId } = req.params;

  try {
    const log = await MetricLog.findOne({
      where: { id: id, metricId: metricId },
    });
    if (!log)
      return res
        .status(404)
        .json({ message: "Log Not Found, cancel deletion" });

    await log.destroy();
    res.status(200).json({ message: "Log deleted successfully", log });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
