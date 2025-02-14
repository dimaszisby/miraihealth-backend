// src/controllers/auth-controller.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";

/**
 * * Authentication Controller
 * Provides user authentication and profile management functions.
 */

// Extend Express Request to include `user`
export interface AuthRequest extends Request {
  user?: User;
}

/**
 * * Generate JWT Token
 * @param {User} user - Authenticated user object
 * @returns {string} JWT token
 */
const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

/**
 * * Register a New User
 * @route POST /api/auth/register
 */
export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      username,
      email,
      password,
      passwordConfirmation,
      age,
      sex,
      isPublicProfile,
    } = req.body;

    if (password !== passwordConfirmation) {
      throw new AppError("Passwords do not match", 400);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
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
  }
);

/**
 * * Login and Retrieve Token
 * @route POST /api/auth/login
 */
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validPassword(password))) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken(user);
    successResponse(res, 200, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        age: user.age,
        sex: user.sex,
        isPublicProfile: user.isPublicProfile,
      },
    });
  }
);

/**
 * * Get Authenticated User's Profile
 * @route GET /api/auth/profile
 */
export const getProfile = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const {
      id,
      username,
      email,
      age,
      sex,
      isPublicProfile,
      createdAt,
      updatedAt,
    } = req.user;

    return successResponse(res, 200, {
      id,
      username,
      email,
      age,
      sex,
      isPublicProfile,
      createdAt,
      updatedAt,
    });
  }
);

/**
 * * Update Authenticated User's Profile
 * @route PUT /api/auth/profile
 */
export const updateProfile = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

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

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.update({ username, email, age, sex, isPublicProfile });
    successResponse(res, 200, "Profile updated successfully");
  }
);

/**
 * * Logout User (Handled Client-Side for JWT)
 * @route POST /api/auth/logout
 */
export const logout = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(200).json({ message: "Logged out successfully" });
};
