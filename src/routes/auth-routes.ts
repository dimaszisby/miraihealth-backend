// src/routes/auth-routes.ts

import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from "../controllers/auth-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user-validator.js";

const router = Router();

/**
 * * Authentication Routes
 * Handles user registration, login, profile management, and logout.
 */

// ✅ **Public Routes**
// 🔹 Register a new user
router.post("/register", validate(createUserSchema), register);

// 🔹 Login user and get token
router.post("/login", login);

// ✅ **Protected Routes (Require Authentication)**
// 🔹 Get current user profile
router.get("/profile", authMiddleware, getProfile);

// 🔹 Update current user profile
router.put(
  "/profile",
  authMiddleware,
  validate(updateUserSchema),
  updateProfile
);

// 🔹 Logout user (Handled client-side for JWT)
router.post("/logout", authMiddleware, logout);

export default router;
