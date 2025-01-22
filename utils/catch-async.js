// utils/catchAsync.js

// * Wrapper to catch Async eror
// prevent unhandled promise rejection
// passing error to the error-handler

/**
 * Wraps an async route handler and passes errors to the global error handler.
 * @param {Function} fn - The async function to wrap.
 * @returns {Function} - A new function that handles errors.
 */

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
