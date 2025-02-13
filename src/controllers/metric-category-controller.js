const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { MetricCategory } = require("../models");
const { successResponse } = require("../utils/response-formatter");
const catchAsync = require("../utils/catch-async");

// Create Category
exports.createCategory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { name, color, icon } = req.body;

  const category = await MetricCategory.create({
    userId: userId,
    name,
    color: color || "#E897A3",
    icon: icon || "📁",
  });

  successResponse(res, 201, { category }, "Category created successfully");
});

// Get All Categories owned by User
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const categories = await MetricCategory.findAll({
    where: { userId: userId },
  });

  successResponse(res, 200, { categories });
});

// Get specific Category by Id
exports.getCategoryById = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  const category = await MetricCategory.findOne({
    where: { id: id, userId: userId },
  });
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  successResponse(res, 200, { category });
});

// Update Category
exports.updateCategory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, icon, color } = req.body;

  const category = await MetricCategory.findOne({
    where: { id: id, userId: userId },
  });
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await category.update({ name, color, icon });
  successResponse(res, 200, { category }, "Category updated successfully");
});

// Delete Category
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  const category = await MetricCategory.findOne({
    where: { id, userId: userId },
  });
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await category.destroy();

  successResponse(res, 200, { category }, "Category deleted successfully");
});
