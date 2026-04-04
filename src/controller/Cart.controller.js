'use strict';

/**
 * Cart is implemented as a PENDING order attached to the user with status "CART".
 * One active cart per user at a time.
 */

const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

const getOrCreateCart = async (userId) => {
  let cart = await prisma.order.findFirst({
    where: { userId, status: 'CART' },
    include: {
      items: {
        include: {
          product: { include: { category: { select: { name: true } } } },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.order.create({
      data: { userId, total: 0, status: 'CART', items: { create: [] } },
      include: {
        items: { include: { product: { include: { category: { select: { name: true } } } } } },
      },
    });
  }

  return cart;
};

const computeTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const formatCart = (cart) => ({
  id: cart.id,
  items: (cart.items || []).map((item) => {
    // Find the specific variant within the embedded product variants array
    const variant = (item.product?.variants || []).find(v => v.id === item.variantId);
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product?.name,
      category: item.product?.category?.name,
      variant: variant || { id: item.variantId, color: 'Unknown', price: item.price },
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: +(item.price * item.quantity).toFixed(2),
    };
  }),
  total: +(cart.total || 0).toFixed(2),
  itemCount: (cart.items || []).reduce((sum, i) => sum + i.quantity, 0),
});

// GET /api/auth/cart
const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, { cart: formatCart(cart) }, 'Cart fetched.');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/cart/items
const addToCart = async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const variant = (product.variants || []).find(v => v.id === variantId);
    if (!variant) return sendError(res, 'Variant not found in this product.', 404);
    if (variant.stock < qty) return sendError(res, `Only ${variant.stock} in stock.`, 400);

    const cart = await getOrCreateCart(req.user.id);

    const existing = cart.items.find((i) => i.productId === productId && i.variantId === variantId);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (variant.stock < newQty) return sendError(res, `Only ${variant.stock} in stock.`, 400);

      await prisma.orderItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.orderItem.create({
        data: { 
          orderId: cart.id, 
          productId: productId,
          variantId: variantId, 
          quantity: qty, 
          price: variant.price || product.price
        },
      });
    }

    const updatedItems = await prisma.orderItem.findMany({ where: { orderId: cart.id } });
    const total = computeTotal(updatedItems);
    await prisma.order.update({ where: { id: cart.id }, data: { total } });

    const updatedCart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, { cart: formatCart(updatedCart) }, 'Item added to cart.');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/cart/items/:itemId
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);
    if (qty < 1) return sendError(res, 'Quantity must be at least 1.', 400);

    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.itemId },
      include: { order: true, product: true },
    });

    if (!item || item.order.userId !== req.user.id || item.order.status !== 'CART') {
      return sendError(res, 'Cart item not found.', 404);
    }

    const variant = (item.product?.variants || []).find(v => v.id === item.variantId);
    if (!variant) return sendError(res, 'Product variant no longer available.', 404);
    if (variant.stock < qty) return sendError(res, `Only ${variant.stock} in stock.`, 400);

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

// DELETE /api/auth/cart/items/:itemId
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

// DELETE /api/auth/cart
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