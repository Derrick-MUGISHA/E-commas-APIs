'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError(res, 'Email already in use.', 409);

    // Only allow USER or SELLER on self-registration
    const allowedRoles = ['USER', 'SELLER'];
    const userRole = allowedRoles.includes(role) ? role : 'USER';

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role: userRole },
    });

    return sendSuccess(res, {
      user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    }, 'Registration successful.', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 'Invalid credentials.', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return sendError(res, 'Invalid credentials.', 401);

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return sendSuccess(res, {
      token,
      user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    return sendSuccess(res, { user }, 'Profile fetched.');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };