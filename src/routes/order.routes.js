'use strict';

const express = require('express');
const { body } = require('express-validator');
const {
  placeOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
} = require('../controller/Order.controller');
const { authenticate, requireAdmin } = require('../middleware/Auth.middleware');
const { validate } = require('../middleware/Validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order from the current cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Cart is empty or insufficient stock
 */
router.post('/', authenticate, placeOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get my orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of my orders
 */
router.get('/', authenticate, getMyOrders);

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     tags: [Orders, Admin]
 *     summary: Get all orders (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All orders across the platform
 */
router.get('/admin/all', authenticate, requireAdmin, getAllOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a specific order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id', authenticate, getOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders, Admin]
 *     summary: Update order status (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch(
    '/:id/status',
    authenticate,
    requireAdmin,
    [
      body('status')
          .isIn(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
          .withMessage('Invalid status.'),
    ],
    validate,
    updateOrderStatus
);

module.exports = router;