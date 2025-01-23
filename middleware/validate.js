// * Validation Middleware
// Used to validate incoming requests agsinst schemas

const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  if (!schema) {
    // If no schema is provided, skip validation
    console.warn("No validation schema provided for this route.");
    return next();
  }

  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      console.error("Validation Errors:", formattedErrors);
      return res.status(400).json({
        status: "fail",
        errors: formattedErrors,
      });
    }
    // For other types of errors, pass them to the global error handler
    console.error("Unexpected Error during Validation:", error);
    next(error);
  }
};

module.exports = validate;
