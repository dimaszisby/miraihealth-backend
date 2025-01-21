const { Metric } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const metricService = require("../services/metric-service");

exports.createMetric = async (req, res) => {
  const userId = req.user.id;
  const { categoryId, originalMetricId, name, unit, version, isPublic } =
    req.body;

  if (!userId)
    return res
      .status(404)
      .json({ message: "User Id parameter is empty, cancelling operations" });

  if (!name || !unit)
    return res.status(404).json({
      message: `Request body incomplete, cancelling operations. Input was name:${name} and unit:${unit}`,
    });

  try {
    const metric = await Metric.create({
      userId: userId,
      categoryId,
      originalMetricId,
      name,
      unit,
      version,
      isPublic,
    });

    res.status(201).json({ message: "Metric created successfully", metric });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllMetrics = async (req, res) => {
  const userId = req.user.id;

  if (!userId)
    return res
      .status(404)
      .json({ message: "User Id parameter is empty, cancelling operations" });

  try {
    const metrics = await metricService.getMetricData(userId);
    res.status(200).json({ metrics });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getMetricById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!userId)
    return res
      .status(404)
      .json({ message: "User Id parameter is empty, cancelling operations" });

  if (!id)
    return res
      .status(404)
      .json({ message: "Metric Id is empty, cancelling operations" });

  try {
    const metric = await Metric.findOne({
      where: { id: id, userId: userId },
    });

    res.status(200).json({ metric });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateMetric = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { categoryId, originalMetricId, name, unit, version, isPublic } =
    req.body;

  if (!userId)
    return res
      .status(404)
      .json({ message: "User Id parameter is empty, cancelling operations" });

  if (!id)
    return res
      .status(404)
      .json({ message: "Metric Id is empty, cancelling operations" });

  try {
    const metric = await Metric.findOne({
      where: { id: id, userId: userId },
    });
    if (!metric) res.status(404).json({ message: "Metric not found" });

    await metric.update({
      categoryId,
      originalMetricId,
      name,
      unit,
      version,
      isPublic,
    });

    res.status(200).json({ message: "Metric updated successfully", metric });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.deleteMetric = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!userId)
    return res
      .status(404)
      .json({ message: "User Id parameter is empty, cancelling operations" });

  if (!id)
    return res
      .status(404)
      .json({ message: "Metric Id is empty, cancelling operations" });

  try {
    const metric = await Metric.findOne({
      where: { id: id, userId: userId },
    });
    if (!metric) return res.status(404).json({ message: "Metric not found" });

    await metric.destroy();

    res.status(200).json({ message: "Metric deleted successfully", metric });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
