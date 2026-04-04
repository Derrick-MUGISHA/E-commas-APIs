'use strict';

const prisma = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logAction } = require('../utils/logger');

// ── Public ────────────────────────────────────────────────────────────────────

const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, categoryId, brand, search, minPrice, maxPrice } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const separatedByPrice = {
      under50: products.filter(p => p.price < 50),
      between50And150: products.filter(p => p.price >= 50 && p.price <= 150),
      over150: products.filter(p => p.price > 150),
    };

    return sendPaginated(res, { grouped: separatedByPrice, all: products }, total, page, limit);
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return sendError(res, 'Invalid product ID format.', 400);

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { name: true } } }
    });

    if (!product) return sendError(res, 'Product not found.', 404);

    const ratings = (product.comments || []).filter((c) => c.rating !== null).map((c) => c.rating);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

    return sendSuccess(res, { product: { ...product, avgRating } }, 'Product fetched.');
  } catch (err) {
    next(err);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [total, products] = await Promise.all([
      prisma.product.count({ where: { categoryId } }),
      prisma.product.findMany({
        where: { categoryId },
        skip,
        take: Number(limit),
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return sendPaginated(res, products, total, page, limit);
  } catch(err) {
    next(err);
  }
};

// ── Admin / Seller ────────────────────────────────────────────────────────────

const createProduct = async (req, res, next) => {
  try {
    const { name, description, categoryId, brand, price, stock, variants, images } = req.body;

    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) return sendError(res, 'Specified category does not exist.', 400);

    const product = await prisma.product.create({
      data: { 
        name, description, categoryId, brand, 
        price: Number(price), stock: Number(stock),
        variants: variants || [],
        images: images || [],
        comments: []
      },
    });

    await logAction('CREATE_PRODUCT', product.id, req.user.id);
    return sendSuccess(res, { product }, 'Product created.', 201);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, brand, price, stock, variants, images } = req.body;
    
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) return sendError(res, 'Specified category does not exist.', 400);
    }

    const dataToUpdate = { name, description, categoryId, brand };
    if (price !== undefined) dataToUpdate.price = Number(price);
    if (stock !== undefined) dataToUpdate.stock = Number(stock);
    if (variants !== undefined) dataToUpdate.variants = variants;
    if (images !== undefined) dataToUpdate.images = images;

    const product = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    await logAction('UPDATE_PRODUCT', product.id, req.user.id);
    return sendSuccess(res, { product }, 'Product updated.');
  } catch (err) {
    if (err.code === 'P2025') return sendError(res, 'Product not found.', 404);
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });

    await logAction('DELETE_PRODUCT', id, req.user.id);
    return sendSuccess(res, {}, 'Product deleted.');
  } catch (err) {
    if (err.code === 'P2025') return sendError(res, 'Product not found.', 404);
    next(err);
  }
};

const uploadProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 'Product not found.', 404);

    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No valid image files provided.', 400);
    }

    // Cloudinary URLs are in file.path
    const imagesData = req.files.map(f => ({
      url: f.path, // This is the Cloudinary URL
      format: f.mimetype.split('/')[1].toUpperCase(),
      size: f.size,
      createdAt: new Date()
    }));

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        images: { push: imagesData }
      }
    });

    await logAction('UPLOAD_PRODUCT_IMAGES', id, req.user.id);
    return sendSuccess(res, { product: updatedProduct }, 'Images uploaded to Cloudinary.', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getProducts, getProduct, getProductsByCategory, 
  createProduct, updateProduct, deleteProduct, uploadProductImages 
};