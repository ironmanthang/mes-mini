const { Joi } = require('./common');

const createPOSchema = Joi.object({
  code: Joi.string().required().uppercase().trim().messages({
    'string.empty': 'PO Number (Code) is required'
  }),
  supplierId: Joi.number().integer().required(),
  orderDate: Joi.date().iso().default(() => new Date()),
  status: Joi.string().valid('DRAFT', 'PENDING').default('DRAFT'), 
  expectedDeliveryDate: Joi.date().iso().min('now').optional().allow(null),
  
  // Financials
  discount: Joi.number().min(0).default(0),
  shippingCost: Joi.number().min(0).default(0),
  tax: Joi.number().min(0).default(0),
  paymentTerms: Joi.string().valid(
    'Net 30', 
    'Due upon receipt', 
    '50% Advance, 50% on delivery'
  ).optional().allow(null, ''),
  deliveryTerms: Joi.string().valid(
    'FOB - Free On Board', 
    'CIF - Cost, Insurance and Freight', 
    'EXW - Ex Works', 
    'DDP - Delivered Duty Paid'
  ).optional().allow(null, ''),
  note: Joi.string().optional().allow(null, ''),

  // The Items List
  details: Joi.array().items(
    Joi.object({
      componentId: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: Joi.number().min(0).required() // User can overwrite the suggested price
    })
  ).min(1).required().messages({
    'array.min': 'Purchase Order must have at least one item'
  })
});

const updatePOSchema = Joi.object({
  expectedDeliveryDate: Joi.date().iso().min('now').optional().allow(null),
  discount: Joi.number().min(0).optional(),
  shippingCost: Joi.number().min(0).optional(),
  tax: Joi.number().min(0).optional(),
  paymentTerms: Joi.string().valid(
    'Net 30', 
    'Due upon receipt', 
    '50% Advance, 50% on delivery'
  ).optional().allow(null, ''),
  
  deliveryTerms: Joi.string().valid(
    'FOB - Free On Board', 
    'CIF - Cost, Insurance and Freight', 
    'EXW - Ex Works', 
    'DDP - Delivered Duty Paid'
  ).optional().allow(null, ''),
  
  note: Joi.string().optional().allow(null, ''),
  
  // They can change status from DRAFT -> PENDING here
  status: Joi.string().valid('DRAFT', 'PENDING', 'CANCELLED').optional(),

  // For simplicity in Mini MES, we might replace the whole details list
  // or just block editing details for now (MVP). 
  // Let's assume for MVP we only allow updating Header info + Status.
});
module.exports = {
  createPOSchema,
  updatePOSchema // Export this
};