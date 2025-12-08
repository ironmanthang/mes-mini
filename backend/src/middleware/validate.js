const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Return all errors, not just the first one
    stripUnknown: true // Remove extra fields that aren't in the schema
  });

  if (error) {
    // Format error messages nicely
    const errorMessage = error.details.map((detail) => detail.message).join('. ');
    return res.status(400).json({ message: errorMessage });
  }

  // Replace req.body with the cleaned/converted data
  req.body = value;
  next();
};

module.exports = validate;