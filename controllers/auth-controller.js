const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { User } = require("../models");
const { successResponse } = require("../utils/response-formatter");
const catchAsync = require("../utils/catch-async");

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register
exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password, age, sex, isPublicProfile } = req.body;

  const existingUser = await User.findOne({
    where: { email: email, username: username },
  });
  if (existingUser) {
    throw new AppError("Credential already in use", 400);
  }

  const user = await User.create({
    username,
    email,
    password,
    age,
    sex,
    isPublicProfile,
  });
  const token = generateToken(user);

  successResponse(res, 201, { token, user }, "User created successfully");
});

// Login and retrive token
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !user.validPassword(password)) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user);
  successResponse(res, 200, {
    token,
    user: {
      id: user.id,
      username: user.username,
      email,
      age: user.age,
      sex: user.sex,
      isPublicProfile: user.isPublicProfile,
    },
  });
});

// Get authenticated user's profile
exports.getProfile = catchAsync(async (req, res, next) => {
  const user = req.user;

  successResponse(res, 200, {
    id: user.id,
    username: user.username,
    email: user.email,
    age: user.age,
    sex: user.sex,
    isPublicProfile: user.isPublicProfile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
});

// Update authenticated user's profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { username, email, password, age, sex, isPublicProfile } = req.body;

  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new AppError("Email already in use", 401);
    }
  }

  if (username && username !== user.username) {
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new AppError("Username already in use", 401);
    }
  }

  await user.update({ username, email, password, age, sex, isPublicProfile });
  successResponse(res, 200, "Profile updated successfully");
});

// Logout user (Optional: Since JWT is stateless, you might handle this on the client-side)
exports.logout = (req, res, next) => {
  // For stateless JWT, logout can be handled by the client by deleting the token.
  res.status(200).json({ message: "Logged out successfully" });
};
