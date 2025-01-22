const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { MetricCategory } = require("../models");
const { successResponse } = require("../utils/response-formatter");

exports.createCategory = async (req, res, next) => {
  const userId = req.user.id;
  const { name, color, icon } = req.body;

  if (!userId) {
    throw new AppError("Required User ID parameter is empty", 400);
  }

  if (!name) {
    throw new AppError(
      `Request body incomplete. Received - name: ${name}, color: ${color}, icon: ${icon}`,
      400
    );
  }

  try {
    const category = await MetricCategory.create({
      userId: userId,
      name,
      color: color || "#E897A3",
      icon: icon || "📁",
    });

    successResponse(res, 201, { category }, "Category created successfully");
  } catch (error) {
    next(error);
  }
};

exports.getAllCategories = async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    throw new AppError("Required User ID parameter is empty", 400);
  }

  try {
    const categories = await MetricCategory.findAll({
      where: { userId: userId },
    });

    successResponse(res, 200, { categories });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!userId) {
    throw new AppError("Required User ID parameter is empty", 400);
  }

  if (!id) {
    throw new AppError("Required Category ID parameter is empty", 400);
  }

  try {
    const category = await MetricCategory.findOne({
      where: { id: id, userId: userId },
    });
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    successResponse(res, 200, { category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, icon, color } = req.body;

  if (!userId) {
    throw new AppError("Required User ID parameter is empty", 400);
  }

  if (!id) {
    throw new AppError("Required Category ID parameter is empty", 400);
  }

  try {
    const category = await MetricCategory.findOne({
      where: { id: id, userId: userId },
    });
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    await category.update({ name, color, icon });
    successResponse(res, 200, { category }, "Category updated successfully");
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!userId) {
    throw new AppError("Required User ID parameter is empty", 400);
  }

  if (!id) {
    throw new AppError("Required Category ID parameter is empty", 400);
  }

  try {
    const category = await MetricCategory.findOne({
      where: { id, userId: userId },
    });
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    await category.destroy();

    successResponse(res, 200, { category }, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
};
