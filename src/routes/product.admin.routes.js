'use strict';

const express = require('express');
const { createProduct, updateProduct, deleteProduct, uploadProductImages } =
  require('../controller/Product.controller');
const upload = require('../middleware/upload.middleware');
const { authenticate, requireAdmin } = require('../middleware/Auth.middleware');
const { validateSchema } = require('../middleware/Zod.middleware');
const { productSchema, productUpdateSchema } = require('../validations/schemas');

const router = express.Router();

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     tags: [Admin Routes]
 *     summary: Create a newly simplistic product
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateSchema(productSchema),
  createProduct
);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   patch:
 *     tags: [Admin Routes]
 *     summary: Update an existing product
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdateRequest'
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validateSchema(productUpdateSchema),
  updateProduct
);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     tags: [Admin Routes]
 *     summary: Delete a product
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

router.post(
  '/:id/images',
  authenticate,
  requireAdmin,
  upload.array('images', 5),
  uploadProductImages
);

module.exports = router;
