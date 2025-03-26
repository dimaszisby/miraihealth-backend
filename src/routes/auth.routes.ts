// src/routes/auth.routes.ts

import { Router } from "express";
import { authMiddleware } from "@/middleware/auth-middleware";
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from "@/controllers/auth.controller";
import { validate } from "@/middleware/validate";
import { userRateLimiter } from "@/middleware/rate-limiter";
import {
  createUserSchema,
  updateUserSchema,
} from "@/types/api/zod-user.schema";

const router = Router();

/**
 * * Authentication Routes
 * Handles user registration, login, profile management, and logout.
 *
 * Use userRateLimiter for writes (Update Profile)
 * - to limit how many logs a single user can create or update within the given time window (default 15 min).
 *
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
  userRateLimiter,
  authMiddleware,
  validate(updateUserSchema),
  updateProfile
);

// 🔹 Logout user (Handled client-side for JWT)
router.post("/logout", authMiddleware, logout);

export default router;
