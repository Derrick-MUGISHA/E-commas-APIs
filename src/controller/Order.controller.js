'use strict';

const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// POST /api/orders  — convert cart → real order
const placeOrder = async (req, res, next) => {
  try {
    const cart = await prisma.order.findFirst({
      where: { userId: req.user.id, status: 'CART' },
      include: { items: { include: { variant: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return sendError(res, 'Your cart is empty.', 400);
    }

    // Stock validation
    for (const item of cart.items) {
      if (item.variant.stock < item.quantity) {
        return sendError(res, `Insufficient stock for SKU: ${item.variant.sku}.`, 400);
      }
    }

    // Deduct stock + mark order PENDING in a transaction
    const order = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id: cart.id },
        data: { status: 'PENDING' },
        include: {
          items: {
            include: {
              variant: { include: { product: { select: { name: true } } } },
            },
          },
        },
      });
    });

    return sendSuccess(res, { order }, 'Order placed successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders  — my orders
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { userId: req.user.id, NOT: { status: 'CART' } };
    if (status) where.status = status;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          items: {
            include: { variant: { include: { product: { select: { name: true, category: true } } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return sendPaginated(res, orders, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, brand: true, category: true } },
                images: { take: 1 },
              },
            },
          },
        },
      },
    });

    if (!order || order.status === 'CART') return sendError(res, 'Order not found.', 404);

    // Non-admin can only see own orders
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
      return sendError(res, 'Access denied.', 403);
    }

    return sendSuccess(res, { order }, 'Order fetched.');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status — admin only
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.status === 'CART') return sendError(res, 'Order not found.', 404);

    // If cancelling, restock items
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      await prisma.$transaction(
        items.map((item) =>
          prisma.variant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });

    return sendSuccess(res, { order: updated }, 'Order status updated.');
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/admin/all — admin: see all orders
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { NOT: { status: 'CART' } };
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, email: true } },
          items: { include: { variant: { select: { sku: true, price: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return sendPaginated(res, orders, total, page, limit);
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, getMyOrders, getOrder, updateOrderStatus, getAllOrders };