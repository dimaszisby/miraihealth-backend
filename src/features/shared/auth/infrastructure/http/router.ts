import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword,
} from "./controller.js";
import { authMiddleware } from "./authMiddleware.js";
import {
  passwordResetEmailRateLimiter,
  passwordResetIpRateLimiter,
  userRateLimiter,
} from "@/shared/middleware/rate-limiter.js";
import { validate } from "@/shared/middleware/validation.js";
import {
  createUserSchema,
  forgotPasswordSchema,
  loginUserSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "./schema.zod.js";
import { methodNotAllowed } from "@/shared/middleware/method-guard.js";
import { requireJsonObjectBody } from "@/shared/middleware/require-json-object.js";

export const createAuthRouter = () => {
  const router = Router();

  router.post(
    "/register",
    requireJsonObjectBody(),
    validate(createUserSchema),
    register,
  );
  router.post(
    "/login",
    userRateLimiter,
    requireJsonObjectBody(),
    validate(loginUserSchema),
    login,
  );

  router.get("/profile", authMiddleware, getProfile);
  router.put(
    "/profile",
    userRateLimiter,
    authMiddleware,
    requireJsonObjectBody(),
    validate(updateUserSchema),
    updateProfile,
  );
  router.post("/logout", authMiddleware, logout);

  router.post(
    "/forgot-password",
    passwordResetIpRateLimiter,
    requireJsonObjectBody(),
    validate(forgotPasswordSchema),
    passwordResetEmailRateLimiter,
    forgotPassword,
  );
  router.post(
    "/reset-password",
    passwordResetIpRateLimiter,
    requireJsonObjectBody(),
    validate(resetPasswordSchema),
    resetPassword,
  );

  router.all("/register", methodNotAllowed(["POST"]));
  router.all("/login", methodNotAllowed(["POST"]));
  router.all("/profile", methodNotAllowed(["GET", "PUT"]));
  router.all("/logout", methodNotAllowed(["POST"]));
  router.all("/forgot-password", methodNotAllowed(["POST"]));
  router.all("/reset-password", methodNotAllowed(["POST"]));

  return router;
};

export const authRouter = createAuthRouter();
