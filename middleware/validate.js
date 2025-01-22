// * Validation Middleware
// Used to validate incoming requests agsinst schemas

const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
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
      return res.status(400).json({
        status: "fail",
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

module.exports = validate;
