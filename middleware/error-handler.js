// middleware/errorHandler.js

// * Centralized Error Handling

const AppError = require("../utils/AppError");
const logger = require("../utils/logger"); // Assuming you have a logger set up

/**
 * Global Error Handling Middleware
 * @param {Error} err - The error object.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */

const errorHandler = (err, req, res, next) => {
  // Debugging: Check if err is an instance of AppError
  console.log("Is instance of AppError:", err instanceof AppError);

  // Log the error
  logger.error(`Error: ${err.message}`, err);

  // If the error is not an instance of AppError, convert it to one
  if (!(err instanceof AppError)) {
    logger.error(`Unhandled Error: ${err.message}`, err);
    err = new AppError("Internal Server Error", 500);
  }

  // Send the error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    // In production, you might not want to expose the stack trace
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
