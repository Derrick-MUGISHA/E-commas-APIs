'use strict';

const errorHandler = (err, req, res, next) => {
  if (err.name !== 'ZodError') {
    console.error('❌ Error:', err.message);
  } else {
    console.warn('⚠️ Validation Error:', 'One or more fields failed validation.');
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `Duplicate value: ${err.meta?.target?.join(', ')} already exists.`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  // Zod Validation Error
  if (err.name === 'ZodError') {
    const issues = err.issues || err.errors || [];
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: issues.map((e) => ({
        path: (e.path || []).join('.'),
        message: e.message,
      })),
    });
  }

  // Default
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
};

module.exports = { errorHandler };