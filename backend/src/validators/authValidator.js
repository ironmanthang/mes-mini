// --- START OF FILE src/validators/authValidator.js ---
const { Joi, phonePattern } = require('./common');

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  fullName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().pattern(phonePattern).optional().messages({
    'string.pattern.base': 'Phone number must be 10-15 digits'
  }),
  address: Joi.string().optional(),
  dateOfBirth: Joi.date().iso().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

module.exports = {
  loginSchema,
  profileUpdateSchema,
  changePasswordSchema
};