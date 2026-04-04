'use strict';

const express = require('express');
const { body } = require('express-validator');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} = require('../controller/Cart.controller');
const { authenticate } = require('../middleware/Auth.middleware');
const { validate } = require('../middleware/Validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get user's active cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active cart details
 */
router.get('/', authenticate, getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemRequest'
 *     responses:
 *       200:
 *         description: Item added
 */
router.post(
    '/items',
    authenticate,
    [
        body('variantId').notEmpty().withMessage('Variant ID is required.'),
        body('quantity')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Quantity must be at least 1.'),
    ],
    validate,
    addToCart
);

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.patch(
    '/items/:itemId',
    authenticate,
    [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.')],
    validate,
    updateCartItem
);

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete('/items/:itemId', authenticate, removeFromCart);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear entire cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/', authenticate, clearCart);

module.exports = router;