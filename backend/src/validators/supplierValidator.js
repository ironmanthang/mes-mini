// src/validators/supplierValidator.js
const { Joi, phonePattern } = require('./common');

const createSupplierSchema = Joi.object({
  code: Joi.string().uppercase().trim().required().messages({
    'string.empty': 'Supplier Code is required',
    'any.required': 'Supplier Code is required'
  }),
  supplierName: Joi.string().trim().required(),
  phoneNumber: Joi.string().pattern(phonePattern).optional().allow(null, ''),
  email: Joi.string().email().optional().allow(null, ''),
  address: Joi.string().optional().allow(null, '')
});


const updateSupplierSchema = Joi.object({
  code: Joi.string().uppercase().trim().optional(),
  supplierName: Joi.string().trim().optional(),
  phoneNumber: Joi.string().pattern(phonePattern).optional().allow(null, ''),
  email: Joi.string().email().optional().allow(null, ''),
  address: Joi.string().optional().allow(null, '')
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema
};