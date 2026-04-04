'use strict';

const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

const createVariant = async (req, res, next) => {
  try {
    const { color, size, sku, price, stock } = req.body;
    const productId = req.params.id;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const variant = await prisma.variant.create({
      data: { color, size, sku, price: Number(price), stock: Number(stock), productId },
    });
    return sendSuccess(res, { variant }, 'Variant created.', 201);
  } catch (err) {
    next(err);
  }
};

const updateVariant = async (req, res, next) => {
  try {
    const { color, size, sku, price, stock } = req.body;
    const variant = await prisma.variant.update({
      where: { id: req.params.variantId },
      data: {
        ...(color && { color }),
        ...(size !== undefined && { size }),
        ...(sku && { sku }),
        ...(price !== undefined && { price: Number(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
      },
    });
    return sendSuccess(res, { variant }, 'Variant updated.');
  } catch (err) {
    next(err);
  }
};

const deleteVariant = async (req, res, next) => {
  try {
    await prisma.variant.delete({ where: { id: req.params.variantId } });
    return sendSuccess(res, {}, 'Variant deleted.');
  } catch (err) {
    next(err);
  }
};

const getVariant = async (req, res, next) => {
  try {
    const variant = await prisma.variant.findUnique({
      where: { id: req.params.variantId },
      include: { images: true, product: { select: { id: true, name: true, category: true } } },
    });
    if (!variant) return sendError(res, 'Variant not found.', 404);
    return sendSuccess(res, { variant }, 'Variant fetched.');
  } catch (err) {
    next(err);
  }
};

module.exports = { createVariant, updateVariant, deleteVariant, getVariant };