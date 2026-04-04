'use strict';

const express = require('express');
const {
  buy,
  placeOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
} = require('../controller/Order.controller');
const { authenticate, requireAdmin } = require('../middleware/Auth.middleware');
const { validateSchema } = require('../middleware/Zod.middleware');
const { buySchema, updateOrderStatusSchema } = require('../validations/schemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and purchase flow
 */

/**
 * @swagger
 * /api/auth/orders/buy:
 *   post:
 *     tags: [Orders]
 *     summary: Buy a single product now (Skip cart)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BuyRequest'
 *     responses:
 *       201:
 *         description: Order placed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       403:
 *         description: Forbidden (e.g. Admin cannot order)
 */
router.post(
  '/buy',
  authenticate,
  validateSchema(buySchema),
  buy
);

/**
 * @swagger
 * /api/auth/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place order from Cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Success
 */
router.post('/', authenticate, placeOrder);

/**
 * @swagger
 * /api/auth/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get my purchase history
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 */
router.get('/', authenticate, getMyOrders);

/**
 * @swagger
 * /api/auth/orders/admin/all:
 *   get:
 *     tags: [Admin Routes]
 *     summary: See all system orders (Admin)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/admin/all', authenticate, requireAdmin, getAllOrders);

/**
 * @swagger
 * /api/auth/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', authenticate, getOrder);

/**
 * @swagger
 * /api/auth/orders/{id}/status:
 *   patch:
 *     tags: [Admin Routes]
 *     summary: Update order status (Admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] }
 *     responses:
 *       200:
 *         description: Success
 */
router.patch(
    '/:id/status',
    authenticate,
    requireAdmin,
    validateSchema(updateOrderStatusSchema),
    updateOrderStatus
);

module.exports = router;