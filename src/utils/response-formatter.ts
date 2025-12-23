import { Response } from "express";

/**
 * * Standardized API Response Helpers
 * Provides a consistent structure for success and error responses.
 */

interface SuccessResponse<T> {
  status: "success";
  message: string;
  code?: number | string;
  data: T | null;
  success?: true;
}

interface ErrorResponse {
  status: "error";
  message: string;
  code?: number | string;
  error?: unknown;
  errors?: string[];
  data: null;
  success?: false;
}

/**
 * Sends a success response.
 *
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param data - Data to be sent in the response (default: null)
 * @param message - Success message (default: "Success")
 * @param code - Optional custom code for the response
 */
const successResponse = <T>(
  res: Response,
  statusCode: number,
  data: T | null,
  message = "Success",
  code?: number | string
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
    code,
    success: true,
  });
};

/**
 * Sends an error response.
 *
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param error - Optional error object or message
 * @param code - Optional custom code for the response
 * @param errors - Optional array of error messages
 */
const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error: unknown = null,
  code?: number | string,
  errors?: string[]
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    status: "error",
    message,
    error,
    code,
    errors,
    data: null,
    success: false,
  });
};
export { successResponse, errorResponse };
