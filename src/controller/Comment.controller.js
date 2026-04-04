'use strict';

const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// POST /api/comments
const createComment = async (req, res, next) => {
  try {
    const { content, rating, productId, parentId } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) return sendError(res, 'Parent comment not found.', 404);
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return sendError(res, 'Rating must be between 1 and 5.', 400);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        rating: rating ? Number(rating) : null,
        userId: req.user.id,
        productId,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, email: true } },
        replies: { include: { user: { select: { id: true, email: true } } } },
      },
    });

    return sendSuccess(res, { comment }, 'Comment posted.', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/comments?productId=...
const getComments = async (req, res, next) => {
  try {
    const { productId, page = 1, limit = 10 } = req.query;
    if (!productId) return sendError(res, 'productId is required.', 400);

    const skip = (Number(page) - 1) * Number(limit);

    const [total, comments] = await Promise.all([
      prisma.comment.count({ where: { productId, parentId: null } }),
      prisma.comment.findMany({
        where: { productId, parentId: null },
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, email: true } },
          replies: {
            include: {
              user: { select: { id: true, email: true } },
              reactions: { select: { type: true } },
            },
          },
          reactions: { select: { type: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Annotate like/dislike counts
    const annotated = comments.map((c) => ({
      ...c,
      likes: c.reactions.filter((r) => r.type === 'LIKE').length,
      dislikes: c.reactions.filter((r) => r.type === 'DISLIKE').length,
      replies: c.replies.map((r) => ({
        ...r,
        likes: r.reactions.filter((rx) => rx.type === 'LIKE').length,
        dislikes: r.reactions.filter((rx) => rx.type === 'DISLIKE').length,
      })),
    }));

    return sendPaginated(res, annotated, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return sendError(res, 'Comment not found.', 404);

    if (req.user.role !== 'ADMIN' && comment.userId !== req.user.id) {
      return sendError(res, 'Access denied.', 403);
    }

    await prisma.comment.delete({ where: { id: comment.id } });
    return sendSuccess(res, {}, 'Comment deleted.');
  } catch (err) {
    next(err);
  }
};

// POST /api/comments/:id/react
const reactToComment = async (req, res, next) => {
  try {
    const { type } = req.body; // LIKE | DISLIKE
    if (!['LIKE', 'DISLIKE'].includes(type)) {
      return sendError(res, 'type must be LIKE or DISLIKE.', 400);
    }

    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return sendError(res, 'Comment not found.', 404);

    const existing = await prisma.commentReaction.findUnique({
      where: { userId_commentId: { userId: req.user.id, commentId: comment.id } },
    });

    if (existing) {
      if (existing.type === type) {
        // Toggle off
        await prisma.commentReaction.delete({ where: { id: existing.id } });
        return sendSuccess(res, {}, 'Reaction removed.');
      }
      // Switch reaction
      await prisma.commentReaction.update({ where: { id: existing.id }, data: { type } });
      return sendSuccess(res, {}, 'Reaction updated.');
    }

    await prisma.commentReaction.create({
      data: { userId: req.user.id, commentId: comment.id, type },
    });

    return sendSuccess(res, {}, 'Reaction added.', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { createComment, getComments, deleteComment, reactToComment };