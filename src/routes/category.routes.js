'use strict';

const express = require('express');
const { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controller/Category.controller');
const { authenticate, requireAdmin } = require('../middleware/Auth.middleware');
const { validateSchema } = require('../middleware/Zod.middleware');
const { categorySchema, categoryUpdateSchema } = require('../validations/schemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management (Public & Admin)
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Fetch all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (Admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateSchema(categorySchema),
  createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update an existing category (Admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       200:
 *         description: Success
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateSchema(categoryUpdateSchema),
  updateCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Remove a category (Admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

module.exports = router;
