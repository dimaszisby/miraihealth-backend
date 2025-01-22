class AppError extends Error {
  /**
   * Creates an instance of AppError.
   * @param {string} message - Error message.
   * @param {number} statusCode - HTTP status code.
   */

  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Distinguish operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
