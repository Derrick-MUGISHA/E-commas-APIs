'use strict';

const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controller/Cart.controller');
const { authenticate } = require('../middleware/Auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: authenticated shopping cart management
 */

/**
 * @swagger
 * /api/auth/cart:
 *   get:
 *     tags: [Cart]
 *     summary: View my shopping cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', authenticate, getCart);

/**
 * @swagger
 * /api/auth/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add product variant to cart
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, variantId, quantity]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string }
 *               quantity: { type: integer, minimum: 1, default: 1 }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/items', authenticate, addToCart);

/**
 * @swagger
 * /api/auth/cart/items/{itemId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update item quantity in cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Success
 */
router.patch('/items/:itemId', authenticate, updateCartItem);

/**
 * @swagger
 * /api/auth/cart/items/{itemId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/items/:itemId', authenticate, removeFromCart);

/**
 * @swagger
 * /api/auth/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear entire cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/', authenticate, clearCart);

module.exports = router;