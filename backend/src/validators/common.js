// --- START OF FILE src/validators/common.js ---
const Joi = require('joi');

const phonePattern = /^[0-9]{10,15}$/;

module.exports = { 
  phonePattern,
  Joi // Export Joi so other files use the same instance
};