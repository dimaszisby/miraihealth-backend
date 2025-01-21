const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth-controller");
const authMiddleware = require("../middleware/auth-middleware");

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected Routes
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
