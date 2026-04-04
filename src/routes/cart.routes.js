'use strict';

const express = require('express');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} = require('../controller/Cart.controller');
const { authenticate } = require('../middleware/Auth.middleware');
const { validateSchema } = require('../middleware/Zod.middleware');
const { addToCartSchema, updateCartItemSchema } = require('../validations/schemas');

const router = express.Router();


router.get('/', authenticate, getCart);


router.post(
    '/items',
    authenticate,
    validateSchema(addToCartSchema),
    addToCart
);


router.patch(
    '/items/:itemId',
    authenticate,
    validateSchema(updateCartItemSchema),
    updateCartItem
);


router.delete('/items/:itemId', authenticate, removeFromCart);


router.delete('/', authenticate, clearCart);

module.exports = router;