import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from "./controller";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware";
import { userRateLimiter } from "@/shared/middleware/rate-limiter";
import { validate } from "@/shared/middleware/validation";
import {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
} from "./schema.zod";

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
