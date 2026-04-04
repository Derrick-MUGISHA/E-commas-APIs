'use strict';

const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// ── Public ────────────────────────────────────────────────────────────────────

const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, brand, search, minPrice, maxPrice } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (category) where.category = category;
    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    // Price filter via variants
    if (minPrice || maxPrice) {
      where.variants = {
        some: {
          price: {
            ...(minPrice && { gte: Number(minPrice) }),
            ...(maxPrice && { lte: Number(maxPrice) }),
          },
        },
      };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          variants: { select: { id: true, color: true, size: true, price: true, stock: true, sku: true } },
          images: { select: { id: true, url: true, format: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return sendPaginated(res, products, total, page, limit);
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        variants: { include: { images: true } },
        images: true,
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { id: true, email: true } },
            replies: {
              include: { user: { select: { id: true, email: true } } },
            },
            reactions: { select: { type: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) return sendError(res, 'Product not found.', 404);

    // Compute average rating
    const ratings = product.comments.filter((c) => c.rating !== null).map((c) => c.rating);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

    return sendSuccess(res, { product: { ...product, avgRating } }, 'Product fetched.');
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = ['ELECTRONICS', 'FASHION', 'HOME', 'BEAUTY', 'SPORTS'];
    const counts = await Promise.all(
      categories.map(async (cat) => ({
        category: cat,
        count: await prisma.product.count({ where: { category: cat } }),
      }))
    );
    return sendSuccess(res, { categories: counts }, 'Categories fetched.');
  } catch (err) {
    next(err);
  }
};

// ── Admin / Seller ────────────────────────────────────────────────────────────

const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, brand } = req.body;
    const product = await prisma.product.create({
      data: { name, description, category, brand },
    });
    return sendSuccess(res, { product }, 'Product created.', 201);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { name, description, category, brand } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, category, brand },
    });
    return sendSuccess(res, { product }, 'Product updated.');
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    return sendSuccess(res, {}, 'Product deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProduct, getCategories, createProduct, updateProduct, deleteProduct };