const { User } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response-formatter");

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

exports.register = async (req, res, next) => {
  const { username, email, password, age, sex, isPublicProfile } = req.body;

  try {
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
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
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
  } catch (error) {
    next(error);
  }
};

// Get authenticated user's profile
exports.getProfile = async (req, res, next) => {
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
};

// Update authenticated user's profile
exports.updateProfile = async (req, res, next) => {
  const user = req.user;
  const { username, email, password, age, sex, isPublicProfile } = req.body;

  try {
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
  } catch (error) {
    next(error);
  }
};

// Logout user (Optional: Since JWT is stateless, you might handle this on the client-side)
exports.logout = (req, res) => {
  // For stateless JWT, logout can be handled by the client by deleting the token.
  res.status(200).json({ message: "Logged out successfully" });
};
