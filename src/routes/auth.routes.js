'use strict';

const express = require('express');
const { register, login, getMe } = require('../controller/Auth.controller');
const { authenticate } = require('../middleware/Auth.middleware');
const { validateSchema } = require('../middleware/Zod.middleware');
const { registerSchema, loginSchema } = require('../validations/schemas');

const router = express.Router();

/**
 * @swagger
 * /api/auth/users/register:
 *   post:
 *     tags: [Open Routes]
 *     summary: Register a new user
 *     description: Create a new account. Role defaults to USER. SELLER can be self-registered; ADMIN must be assigned by an existing admin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             user:
 *               summary: Regular user
 *               value: { email: "alice@example.com", password: "secret123" }
 *             seller:
 *               summary: Seller account
 *               value: { email: "seller@example.com", password: "secret123", role: "SELLER" }
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation error
 */
router.post(
  '/register',
  validateSchema(registerSchema),
  register
);

/**
 * @swagger
 * /api/auth/users/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     description: Authenticate and receive a JWT token. Use the token in the Authorization header as `Bearer <token>`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Admin (after seeding)
 *               value: { email: "admin@ecomus.com", password: "Admin@1234" }
 *             user:
 *               summary: Sample user (after seeding)
 *               value: { email: "john@example.com", password: "User@1234" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  validateSchema(loginSchema),
  login
);

/**
 * @swagger
 * /api/auth/users/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, getMe);

module.exports = router;