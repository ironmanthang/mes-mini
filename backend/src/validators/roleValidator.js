// --- START OF FILE src/validators/roleValidator.js ---
const { Joi } = require('./common');

const roleSchema = Joi.object({
  roleName: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Role name cannot be empty',
    'any.required': 'Role name is required'
  })
});

module.exports = { roleSchema };