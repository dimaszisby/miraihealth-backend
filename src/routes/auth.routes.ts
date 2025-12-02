import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from "@/controllers/auth.controller";
import { authMiddleware } from "@/middleware/auth-middleware";
import { userRateLimiter } from "@/middleware/rate-limiter";
import { validate } from "@/middleware/validate";
import {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
} from "@/types/api/zod-user.schema";

const router = Router();

// **Public Routes**
router.post("/register", validate(createUserSchema), register);
router.post("/login", userRateLimiter, validate(loginUserSchema), login);

// **Protected Routes (Require Authentication)**
router.get("/profile", authMiddleware, getProfile);
router.put(
  "/profile",
  userRateLimiter,
  authMiddleware,
  validate(updateUserSchema),
  updateProfile
);
router.post("/logout", authMiddleware, logout);

export default router;
