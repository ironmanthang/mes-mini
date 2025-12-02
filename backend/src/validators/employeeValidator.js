// --- START OF FILE src/validators/employeeValidator.js ---
const { Joi, phonePattern } = require('./common');

const employeeCreateSchema = Joi.object({
  fullName: Joi.string().required(),
  username: Joi.string().alphanum().min(3).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().pattern(phonePattern).required().messages({
    'string.pattern.base': 'Phone number must be 10-15 digits'
  }),
  address: Joi.string().optional(),
  dateOfBirth: Joi.date().iso().optional(),
  hireDate: Joi.date().iso().required(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
  roleIds: Joi.array().items(Joi.number().integer()).min(1).required().messages({
    'array.min': 'A new employee must be assigned at least one role'
  })
});

const employeeUpdateSchema = Joi.object({
  fullName: Joi.string().optional(),
  username: Joi.string().alphanum().min(3).optional(),
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().pattern(phonePattern).optional(),
  password: Joi.string().min(6).optional().allow(''),
  address: Joi.string().optional(),
  dateOfBirth: Joi.date().iso().optional().allow(null),
  hireDate: Joi.date().iso().optional(),
  terminationDate: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED').optional(),
  roleIds: Joi.array().items(Joi.number().integer()).min(1).optional()
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED').required()
});

module.exports = {
  employeeCreateSchema,
  employeeUpdateSchema,
  statusUpdateSchema
};