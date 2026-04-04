'use strict';

const { sendError } = require('../utils/response');

/**
 * Zod validation middleware
 * @param {import('zod').ZodSchema} schema 
 */
const validateSchema = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors && Array.isArray(error.errors)) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      return sendError(res, 'Validation failed.', 422, formattedErrors);
    }
    next(error);
  }
};

module.exports = { validateSchema };
