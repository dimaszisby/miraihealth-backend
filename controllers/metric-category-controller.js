const { MetricCategory } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { where } = require("sequelize");

exports.createCategory = async (req, res) => {
  const userId = req.user.id;
  const { name, color, icon } = req.body;

  try {
    const category = await MetricCategory.create({
      userId: userId,
      name,
      color: color || "#E897A3",
      icon: icon || "📁",
    });

    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  const userId = req.user.id;

  try {
    const categories = await MetricCategory.findAll({
      where: { userId: userId },
    });

    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const category = await MetricCategory.findOne({
      where: { id: id, userId: userId },
    });

    res.status(200).json({ category });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, icon, color } = req.body;

  try {
    const category = await MetricCategory.findOne({
      where: { id: id, userId: userId },
    });
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    await category.update({ name, color, icon });
    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const category = await MetricCategory.findOne({
      where: { id, userId: userId },
    });
    if (!category)
      return res
        .status(404)
        .json({ message: "Category not found, delete cancelled" });

    await category.destroy();
    res
      .status(200)
      .json({ message: "Category deleted successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
