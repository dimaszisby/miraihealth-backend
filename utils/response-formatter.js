const successResponse = (res, statusCode, data, message = "Success") => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

const errorResponse = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    status: "error",
    message,
    error,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
