'use strict';

const { z } = require('zod');

// ── Auth ──────────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Valid email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['USER', 'SELLER']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required.'),
  password: z.string().min(1, 'Password is required.')
});

// ── Product ───────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID.'),
  brand: z.string().optional(),
  price: z.number().nonnegative('Price must be a positive number.'),
  stock: z.number().int().nonnegative('Stock must be a non-negative integer.'),
  variants: z.array(z.object({
    color: z.string(),
    size: z.string().optional(),
    sku: z.string(),
    price: z.number().nonnegative(),
    stock: z.number().int().nonnegative()
  })).optional(),
  images: z.array(z.object({
    url: z.string().url('Invalid image URL.'),
    format: z.string().optional(),
    size: z.number().int().optional()
  })).optional(),
  comments: z.array(z.any()).optional() // Comments are usually created via separate endpoint, but allowing here for full sync
});

const productUpdateSchema = productSchema.partial();

const variantSchema = z.object({
  color: z.string().min(1, 'Color is required.'),
  size: z.string().optional(),
  sku: z.string().min(1, 'SKU is required.'),
  price: z.number().nonnegative('Price must be positive.'),
  stock: z.number().int().nonnegative('Stock must be non-negative.')
});

const variantUpdateSchema = variantSchema.partial();

// ── Order ─────────────────────────────────────────────────────────────────────

const buySchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID format.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.')
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
});

// ── Cart ──────────────────────────────────────────────────────────────────────

const addToCartSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID format.'),
  variantId: z.string().min(1, 'Variant ID is required.'),
  quantity: z.number().int().min(1).optional()
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1)
});

// ── Comment ───────────────────────────────────────────────────────────────────

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required.'),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID.'),
  rating: z.number().int().min(1).max(5).optional()
});

const commentReactionSchema = z.object({
  type: z.enum(['LIKE', 'DISLIKE'])
});

// ── Category ──────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
  description: z.string().optional()
});

const categoryUpdateSchema = categorySchema.partial();

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  buySchema,
  updateOrderStatusSchema,
  addToCartSchema,
  updateCartItemSchema,
  commentReactionSchema,
  variantSchema,
  variantUpdateSchema,
  categorySchema,
  categoryUpdateSchema
};
