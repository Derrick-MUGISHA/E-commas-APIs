'use strict';

const express = require('express');
const { body } = require('express-validator');
const {
    createComment,
    getComments,
    deleteComment,
    reactToComment,
} = require('../controller/Comment.controller');
const { authenticate } = require('../middleware/Auth.middleware');
const { validate } = require('../middleware/Validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/comments:
 *   get:
 *     tags: [Comments]
 *     summary: Get comments for a specific product
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/', getComments);

/**
 * @swagger
 * /api/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Post a comment or review
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreateRequest'
 *     responses:
 *       201:
 *         description: Comment posted
 */
router.post(
    '/',
    authenticate,
    [
        body('content').notEmpty().withMessage('Content is required.'),
        body('productId').notEmpty().withMessage('Product ID is required.'),
        body('rating')
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5.'),
    ],
    validate,
    createComment
);

/**
 * @swagger
 * /api/comments/{id}/react:
 *   post:
 *     tags: [Comments]
 *     summary: Like or Dislike a comment
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
 *               type:
 *                 type: string
 *                 enum: [LIKE, DISLIKE]
 *     responses:
 *       201:
 *         description: Reaction added or updated
 */
router.post(
    '/:id/react',
    authenticate,
    [
        body('type')
            .isIn(['LIKE', 'DISLIKE'])
            .withMessage('Type must be LIKE or DISLIKE.'),
    ],
    validate,
    reactToComment
);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
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
 *         description: Comment deleted
 */
router.delete('/:id', authenticate, deleteComment);

module.exports = router;