const { ValidationError } = require('../utils/errors');

// Returns middleware that validates req.body against a Zod schema.
// Implemented fully in Prompt 3 alongside the resource schemas.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(new ValidationError('Invalid request body', details));
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
