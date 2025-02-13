/**
 * Custom error class for handling application-specific errors.
 */

class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational: boolean;
  /**
   * Creates an instance of AppError.
   * @param message - Error message.
   * @param statusCode - HTTP status code.
   */

  constructor(message: string, statusCode: number) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // Maintain correct prototype chain

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.isOperational = true; // Distinguish operational errors from programming errors

    Error.captureStackTrace(this);
  }
}

export default AppError;
