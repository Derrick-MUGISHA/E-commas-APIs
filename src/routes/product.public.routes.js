'use strict';

const express = require('express');
const { getProducts, getProduct, getProductsByCategory } =
  require('../controller/Product.controller');

const router = express.Router();

/**
 * @swagger
 * /api/public/products:
 *   get:
 *     tags: [Open Routes]
 *     summary: List all products (Open API)
 *     responses:
 *       200:
 *         description: List of products grouped by price
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductSearchResponse'
 */
router.get('/', getProducts);

router.get('/category/:categoryId', getProductsByCategory);

/**
 * @swagger
 * /api/public/products/{id}:
 *   get:
 *     tags: [Open Routes]
 *     summary: Get a single product with nested data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product detail returned entirely
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 message: { type: 'string' }
 *                 data: 
 *                   type: object
 *                   properties:
 *                     product: 
 *                       $ref: '#/components/schemas/Product'
 *                     avgRating: { type: 'number' }
 */
router.get('/:id', getProduct);

module.exports = router;
