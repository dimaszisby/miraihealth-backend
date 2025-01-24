const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth-controller");
const authMiddleware = require("../middleware/auth-middleware");
const validate = require("../middleware/validate");
const {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  deleteUserSchema,
} = require("../validators/user-validator");

// *Public Routes
// CREATE User
router.post("/register", validate(createUserSchema), authController.register);

// LOGIN User
router.post("/login", authController.login);

// * Protected Routes
// GET current User Profile
router.get(
  "/profile",
  validate(getUserSchema),
  authMiddleware,
  authController.getProfile
);

// UPDATE current User Profile
router.put(
  "/profile",
  validate(updateUserSchema),
  authMiddleware,
  authController.updateProfile
);

// LOGOUT current User
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
