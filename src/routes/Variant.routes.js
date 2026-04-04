'use strict';

const express = require('express');
const { body } = require('express-validator');
const { createVariant, updateVariant, deleteVariant, getVariant } =
  require('../controllers/variant.controller');
const { authenticate, requireAdminOrSeller } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/products/{id}/variants:
 *   post:
 *     tags: [Variants]
 *     summary: Add a variant to a product (Admin/Seller only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product ID
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VariantCreateRequest'
 *     responses:
 *       201:
 *         description: Variant created
 *       404:
 *         description: Product not found
 *       409:
 *         description: SKU already exists
 */
router.post(
  '/:id/variants',
  authenticate,
  requireAdminOrSeller,
  [
    body('color').notEmpty().withMessage('Color is required.'),
    body('sku').notEmpty().withMessage('SKU is required.'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
  ],
  validate,
  createVariant
);

/**
 * @swagger
 * /api/products/{id}/variants/{variantId}:
 *   get:
 *     tags: [Variants]
 *     summary: Get a specific variant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Variant details
 *       404:
 *         description: Variant not found
 */
router.get('/:id/variants/:variantId', getVariant);

/**
 * @swagger
 * /api/products/{id}/variants/{variantId}:
 *   patch:
 *     tags: [Variants]
 *     summary: Update a variant (Admin/Seller only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VariantCreateRequest'
 *     responses:
 *       200:
 *         description: Variant updated
 *       404:
 *         description: Variant not found
 */
router.patch(
  '/:id/variants/:variantId',
  authenticate,
  requireAdminOrSeller,
  [
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive.'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative.'),
  ],
  validate,
  updateVariant
);

/**
 * @swagger
 * /api/products/{id}/variants/{variantId}:
 *   delete:
 *     tags: [Variants]
 *     summary: Delete a variant (Admin/Seller only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Variant deleted
 *       404:
 *         description: Variant not found
 */
router.delete('/:id/variants/:variantId', authenticate, requireAdminOrSeller, deleteVariant);

module.exports = router;