'use strict';

const prisma = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logAction } = require('../utils/logger');

const getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [total, categories] = await Promise.all([
      prisma.category.count(),
      prisma.category.findMany({
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
    ]);

    return sendPaginated(res, categories, total, page, limit);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.create({
      data: { name, description },
    });

    await logAction('CREATE_CATEGORY', category.id, req.user.id);
    return sendSuccess(res, { category }, 'Category created.', 201);
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name, description },
    });

    await logAction('UPDATE_CATEGORY', category.id, req.user.id);
    return sendSuccess(res, { category }, 'Category updated.');
  } catch (err) {
    if (err.code === 'P2025') return sendError(res, 'Category not found.', 404);
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return sendError(res, 'Cannot delete category with associated products.', 400);
    }

    await prisma.category.delete({ where: { id } });

    await logAction('DELETE_CATEGORY', id, req.user.id);
    return sendSuccess(res, {}, 'Category deleted.');
  } catch (err) {
    if (err.code === 'P2025') return sendError(res, 'Category not found.', 404);
    next(err);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
