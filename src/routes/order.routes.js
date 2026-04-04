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


router.post(
  '/buy',
  authenticate,
  validateSchema(buySchema),
  buy
);


router.post('/', authenticate, placeOrder);


router.get('/', authenticate, getMyOrders);


router.get('/admin/all', authenticate, requireAdmin, getAllOrders);


router.get('/:id', authenticate, getOrder);


router.patch(
    '/:id/status',
    authenticate,
    requireAdmin,
    validateSchema(updateOrderStatusSchema),
    updateOrderStatus
);

module.exports = router;