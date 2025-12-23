import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from "./controller.js";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware.js";
import { userRateLimiter } from "@/shared/middleware/rate-limiter.js";
import { validate } from "@/shared/middleware/validation.js";
import {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
} from "./schema.zod.js";

export const createAuthRouter = () => {
  const router = Router();

  router.post("/register", validate(createUserSchema), register);
  router.post("/login", userRateLimiter, validate(loginUserSchema), login);

  router.get("/profile", authMiddleware, getProfile);
  router.put(
    "/profile",
    userRateLimiter,
    authMiddleware,
    validate(updateUserSchema),
    updateProfile
  );
  router.post("/logout", authMiddleware, logout);

  return router;
};

export const authRouter = createAuthRouter();
