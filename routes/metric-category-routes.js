const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/metric-category-controller");
const authMiddleware = require("../middleware/auth-middleware");
const validate = require("../middleware/validate");
const {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  getMetricCategorySchema,
  deleteMetricCategorySchema,
} = require("../validators/metric-category-validator");

router.use(authMiddleware);

// * Routes

// CREATE Category
router.post(
  "/",
  validate(createMetricCategorySchema),
  categoryController.createCategory
);

// GET All Categories by User Id
router.get("/", categoryController.getAllCategories);

// GET specific Category by Id
router.get(
  "/:id",
  authMiddleware,
  validate(getMetricCategorySchema),
  categoryController.getCategoryById
);

// UPDATE Category
router.put(
  "/:id",
  validate(updateMetricCategorySchema),
  categoryController.updateCategory
);

// DELETE Category
router.delete(
  "/:id",
  validate(deleteMetricCategorySchema),
  categoryController.deleteCategory
);

module.exports = router;
