'use strict';

const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// POST /api/comments
const createComment = async (req, res, next) => {
  try {
    const { content, rating, productId } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const newComment = {
      id: uuidv4(),
      content,
      rating: rating ? Number(rating) : null,
      userId: req.user.id,
      reactions: [],
      replies: [],
      createdAt: new Date()
    };

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        comments: {
          push: newComment
        }
      }
    });

    return sendSuccess(res, { comment: newComment }, 'Comment posted.', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/comments?productId=...
const getComments = async (req, res, next) => {
  try {
    const { productId } = req.query;
    if (!productId) return sendError(res, 'productId is required.', 400);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const comments = (product.comments || []).map(c => ({
      ...c,
      likes: (c.reactions || []).filter(r => r.type === 'LIKE').length,
      dislikes: (c.reactions || []).filter(r => r.type === 'DISLIKE').length,
    }));

    return sendSuccess(res, { comments, total: comments.length }, 'Comments fetched.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params; // Comment ID
    const { productId } = req.query; // Need productId to find the document

    if (!productId) return sendError(res, 'productId is required to identify the comment.', 400);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const comment = (product.comments || []).find(c => c.id === id);
    if (!comment) return sendError(res, 'Comment not found.', 404);

    if (req.user.role !== 'ADMIN' && comment.userId !== req.user.id) {
      return sendError(res, 'Access denied.', 403);
    }

    const updatedComments = product.comments.filter(c => c.id !== id);

    await prisma.product.update({
      where: { id: productId },
      data: { comments: updatedComments }
    });

    return sendSuccess(res, {}, 'Comment deleted.');
  } catch (err) {
    next(err);
  }
};

// POST /api/comments/:id/react
const reactToComment = async (req, res, next) => {
  try {
    const { id } = req.params; // Comment ID
    const { type, productId } = req.body;

    if (!productId) return sendError(res, 'productId is required.', 400);
    if (!['LIKE', 'DISLIKE'].includes(type)) return sendError(res, 'Invalid reaction type.', 400);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const comments = [...(product.comments || [])];
    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex === -1) return sendError(res, 'Comment not found.', 404);

    const comment = comments[commentIndex];
    let reactions = [...(comment.reactions || [])];
    const existingIndex = reactions.findIndex(r => r.userId === req.user.id);

    if (existingIndex !== -1) {
      if (reactions[existingIndex].type === type) {
        reactions.splice(existingIndex, 1); // Toggle off
      } else {
        reactions[existingIndex].type = type; // Switch
      }
    } else {
      reactions.push({ id: uuidv4(), userId: req.user.id, type, createdAt: new Date() });
    }

    comments[commentIndex].reactions = reactions;

    await prisma.product.update({
      where: { id: productId },
      data: { comments }
    });

    return sendSuccess(res, { reactions }, 'Reaction updated.');
  } catch (err) {
    next(err);
  }
};

module.exports = { createComment, getComments, deleteComment, reactToComment };