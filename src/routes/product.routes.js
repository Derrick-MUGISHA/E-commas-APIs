'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getProducts, getProduct, getCategories, createProduct, updateProduct, deleteProduct } =
  require('../controllers/product.controller');
const { authenticate, requireAdminOrSeller } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List all products (with filtering & pagination)
 *     description: Public endpoint. Supports search, category/brand filter, price range, and pagination.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [ELECTRONICS, FASHION, HOME, BEAUTY, SPORTS] }
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *         description: Case-insensitive brand search
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in name & description
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     tags: [Products]
 *     summary: Get all categories with product counts
 *     responses:
 *       200:
 *         description: Category list
 */
router.get('/categories', getCategories);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a single product with variants, images and reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProduct);

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (Admin/Seller only)
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
 *         description: Product created
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  authenticate,
  requireAdminOrSeller,
  [
    body('name').notEmpty().withMessage('Name is required.'),
    body('category')
      .isIn(['ELECTRONICS', 'FASHION', 'HOME', 'BEAUTY', 'SPORTS'])
      .withMessage('Invalid category.'),
  ],
  validate,
  createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product (Admin/Seller only)
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
 *             $ref: '#/components/schemas/ProductCreateRequest'
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.patch(
  '/:id',
  authenticate,
  requireAdminOrSeller,
  [
    body('category')
      .optional()
      .isIn(['ELECTRONICS', 'FASHION', 'HOME', 'BEAUTY', 'SPORTS'])
      .withMessage('Invalid category.'),
  ],
  validate,
  updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete('/:id', authenticate, requireAdminOrSeller, deleteProduct);

module.exports = router;