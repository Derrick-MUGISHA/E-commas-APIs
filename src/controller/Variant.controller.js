'use strict';

const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

const createVariant = async (req, res, next) => {
  try {
    const { color, size, sku, price, stock } = req.body;
    const productId = req.params.id;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const newVariant = {
      id: uuidv4(),
      color,
      size,
      sku,
      price: Number(price),
      stock: Number(stock),
      images: [],
      createdAt: new Date()
    };

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        variants: {
          push: newVariant
        }
      }
    });

    return sendSuccess(res, { variant: newVariant }, 'Variant created.', 201);
  } catch (err) {
    next(err);
  }
};

const updateVariant = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;
    const { color, size, sku, price, stock } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const variantIndex = (product.variants || []).findIndex(v => v.id === variantId);
    if (variantIndex === -1) return sendError(res, 'Variant not found.', 404);

    const updatedVariants = [...product.variants];
    const target = updatedVariants[variantIndex];

    updatedVariants[variantIndex] = {
      ...target,
      ...(color && { color }),
      ...(size !== undefined && { size }),
      ...(sku && { sku }),
      ...(price !== undefined && { price: Number(price) }),
      ...(stock !== undefined && { stock: Number(stock) }),
    };

    await prisma.product.update({
      where: { id },
      data: { variants: updatedVariants }
    });

    return sendSuccess(res, { variant: updatedVariants[variantIndex] }, 'Variant updated.');
  } catch (err) {
    next(err);
  }
};

const deleteVariant = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const updatedVariants = (product.variants || []).filter(v => v.id !== variantId);

    await prisma.product.update({
      where: { id },
      data: { variants: updatedVariants }
    });

    return sendSuccess(res, {}, 'Variant deleted.');
  } catch (err) {
    next(err);
  }
};

const getVariant = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 'Product not found.', 404);

    const variant = (product.variants || []).find(v => v.id === variantId);
    if (!variant) return sendError(res, 'Variant not found.', 404);

    return sendSuccess(res, { variant, product: { id: product.id, name: product.name } }, 'Variant fetched.');
  } catch (err) {
    next(err);
  }
};

module.exports = { createVariant, updateVariant, deleteVariant, getVariant };