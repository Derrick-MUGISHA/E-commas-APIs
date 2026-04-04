'use strict';

const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return sendError(res, 'User not found.', 401);

    req.user = user;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token.', 401);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 'Unauthenticated.', 401);
  if (!roles.includes(req.user.role)) {
    return sendError(res, `Access denied. Requires role: ${roles.join(' or ')}.`, 403);
  }
  next();
};

const requireAdmin = requireRole('ADMIN');
const requireAdminOrSeller = requireRole('ADMIN', 'SELLER');

module.exports = { authenticate, requireRole, requireAdmin, requireAdminOrSeller };