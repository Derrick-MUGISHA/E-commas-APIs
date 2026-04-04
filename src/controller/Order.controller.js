'use strict';

const prisma = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logAction } = require('../utils/logger');

// POST /api/auth/orders/buy — skip cart entirely
const buy = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);
    const order = await prisma.$transaction(async (tx) => {
      const { variantId } = req.body;
      let finalPrice = product.price;
      
      const updateData = {
        orderCount: { increment: qty }
      };

      if (variantId) {
        const variantIndex = (product.variants || []).findIndex(v => v.id === variantId);
        if (variantIndex === -1) throw new Error('Variant not found.');
        if (product.variants[variantIndex].stock < qty) throw new Error('Insufficient variant stock.');
        
        const updatedVariants = [...product.variants];
        updatedVariants[variantIndex].stock -= qty;
        updateData.variants = updatedVariants;
        finalPrice = product.variants[variantIndex].price || product.price;
      } else {
        if (product.stock < qty) throw new Error('Insufficient product stock.');
        updateData.stock = { decrement: qty };
      }

      await tx.product.update({
        where: { id: productId },
        data: updateData,
      });

      // Create PENDING order
      return tx.order.create({
        data: {
          userId: req.user.id,
          total: finalPrice * qty,
          status: 'PENDING',
          items: {
            create: [
              { productId, variantId: variantId || null, quantity: qty, price: finalPrice }
            ]
          }
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    });

    await logAction('PLACE_DIRECT_ORDER', order.id, req.user.id);
    return sendSuccess(res, { order }, 'Direct order placed successfully.', 201);
  } catch (err) {
    next(err);
  }
};

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
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product ${item.productId} not found.`);

        const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
        if (variantIndex === -1) throw new Error(`Variant ${item.variantId} not found.`);
        if (product.variants[variantIndex].stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}.`);

        // Update the variant stock inside the array
        const updatedVariants = [...product.variants];
        updatedVariants[variantIndex].stock -= item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { 
            variants: updatedVariants,
            orderCount: { increment: item.quantity }
          },
        });
      }

      return tx.order.update({
        where: { id: cart.id },
        data: { status: 'PENDING' },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, variants: true } }
            },
          },
        },
      });
    });

    await logAction('PLACE_CART_ORDER', order.id, req.user.id);
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
            include: { product: { select: { id: true, name: true, category: true, variants: true } } },
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
            product: { select: { id: true, name: true, brand: true, category: true, variants: true, images: true } }
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
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) continue;

          const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
          if (variantIndex === -1) continue;

          const updatedVariants = [...product.variants];
          updatedVariants[variantIndex].stock += item.quantity;

          await tx.product.update({
            where: { id: product.id },
            data: { 
              variants: updatedVariants,
              orderCount: { decrement: item.quantity }
            }
          });
        }
      });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });

    await logAction('UPDATE_ORDER_STATUS', updated.id, req.user.id);
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
          items: { include: { product: { select: { name: true, price: true, variants: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return sendPaginated(res, orders, total, page, limit);
  } catch (err) {
    next(err);
  }
};

module.exports = { buy, placeOrder, getMyOrders, getOrder, updateOrderStatus, getAllOrders };