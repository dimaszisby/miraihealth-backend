import { Router } from "express";
const router = Router();
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from "../src/controllers/auth-controller";
import authMiddleware from "../middleware/auth-middleware";
import validate from "../middleware/validate";
import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user-validator";

// *Public Routes
// CREATE User
router.post("/register", validate(createUserSchema), register);

// LOGIN User
router.post("/login", login);

// * Protected Routes
// GET current User Profile
router.get("/profile", authMiddleware, getProfile);

// UPDATE current User Profile
router.put(
  "/profile",
  validate(updateUserSchema),
  authMiddleware,
  updateProfile
);

// LOGOUT current User
router.post("/logout", authMiddleware, logout);

export default router;
