'use strict';

/**
 * Cart is implemented as a PENDING order attached to the user.
 * One active cart per user at a time.
 */

const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

const getOrCreateCart = async (userId) => {
  let cart = await prisma.order.findFirst({
    where: { userId, status: 'CART' },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, category: true, brand: true } },
              images: { take: 1 },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.order.create({
      data: { userId, total: 0, status: 'CART', items: { create: [] } },
      include: {
        items: { include: { variant: { include: { product: true, images: { take: 1 } } } } },
      },
    });
  }

  return cart;
};

const computeTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const formatCart = (cart) => ({
  id: cart.id,
  items: cart.items.map((item) => ({
    id: item.id,
    variant: item.variant,
    quantity: item.quantity,
    unitPrice: item.price,
    subtotal: +(item.price * item.quantity).toFixed(2),
  })),
  total: +cart.total.toFixed(2),
  itemCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
});

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, { cart: formatCart(cart) }, 'Cart fetched.');
  } catch (err) {
    next(err);
  }
};

// POST /api/cart/items
const addToCart = async (req, res, next) => {
  try {
    const { variantId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    const variant = await prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) return sendError(res, 'Variant not found.', 404);
    if (variant.stock < qty) return sendError(res, `Only ${variant.stock} in stock.`, 400);

    const cart = await getOrCreateCart(req.user.id);

    const existing = cart.items.find((i) => i.variantId === variantId);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (variant.stock < newQty) return sendError(res, `Only ${variant.stock} in stock.`, 400);

      await prisma.orderItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.orderItem.create({
        data: { orderId: cart.id, variantId, quantity: qty, price: variant.price },
      });
    }

    // Refresh and recompute total
    const updatedItems = await prisma.orderItem.findMany({ where: { orderId: cart.id } });
    const total = computeTotal(updatedItems);
    await prisma.order.update({ where: { id: cart.id }, data: { total } });

    const updatedCart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, { cart: formatCart(updatedCart) }, 'Item added to cart.', 200);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/cart/items/:itemId
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (qty < 1) return sendError(res, 'Quantity must be at least 1.', 400);

    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.itemId },
      include: { order: true, variant: true },
    });

    if (!item || item.order.userId !== req.user.id || item.order.status !== 'CART') {
      return sendError(res, 'Cart item not found.', 404);
    }

    if (item.variant.stock < qty) return sendError(res, `Only ${item.variant.stock} in stock.`, 400);

    await prisma.orderItem.update({ where: { id: item.id }, data: { quantity: qty } });

    const allItems = await prisma.orderItem.findMany({ where: { orderId: item.orderId } });
    const total = computeTotal(allItems);
    await prisma.order.update({ where: { id: item.orderId }, data: { total } });

    const cart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, { cart: formatCart(cart) }, 'Cart item updated.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/items/:itemId
const removeFromCart = async (req, res, next) => {
  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.itemId },
      include: { order: true },
    });

    if (!item || item.order.userId !== req.user.id || item.order.status !== 'CART') {
      return sendError(res, 'Cart item not found.', 404);
    }

    await prisma.orderItem.delete({ where: { id: item.id } });

    const allItems = await prisma.orderItem.findMany({ where: { orderId: item.orderId } });
    const total = computeTotal(allItems);
    await prisma.order.update({ where: { id: item.orderId }, data: { total } });

    const cart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, { cart: formatCart(cart) }, 'Item removed from cart.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    const cart = await prisma.order.findFirst({ where: { userId: req.user.id, status: 'CART' } });
    if (cart) {
      await prisma.orderItem.deleteMany({ where: { orderId: cart.id } });
      await prisma.order.update({ where: { id: cart.id }, data: { total: 0 } });
    }
    return sendSuccess(res, {}, 'Cart cleared.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };