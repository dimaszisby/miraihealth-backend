import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/metric-category-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  getMetricCategorySchema,
  deleteMetricCategorySchema,
} from "../validators/metric-category-validator.js";

const router = Router();

// * Apply Authentication Middleware for all category routes
router.use(authMiddleware);

// * Routes

// CREATE Category
router.post("/", validate(createMetricCategorySchema), createCategory);

// GET All Categories by User Id
router.get("/", getAllCategories);

// GET specific Category by Id
router.get("/:id", validate(getMetricCategorySchema), getCategoryById);

// UPDATE Category
router.put("/:id", validate(updateMetricCategorySchema), updateCategory);

// DELETE Category
router.delete("/:id", validate(deleteMetricCategorySchema), deleteCategory);

export default router;
