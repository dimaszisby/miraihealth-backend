// src/utils/response-formatter.ts

import { Response } from "express";

/**
 * * Standardized API Response Helpers
 * Provides a consistent structure for success and error responses.
 */

interface SuccessResponse<T> {
  status: "success";
  message: string;
  data: T;
}

interface ErrorResponse {
  status: "error";
  message: string;
  error?: unknown;
}

/**
 * Sends a success response.
 *
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param data - Data to be sent in the response
 * @param message - Optional success message (default: "Success")
 */
const successResponse = <T>(
  res: Response,
  statusCode: number,
  data: T,
  message = "Success"
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

/**
 * Sends an error response.
 *
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param error - Optional error object (default: null)
 */
const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error: unknown = null
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    status: "error",
    message,
    error,
  });
};

export { successResponse, errorResponse };
