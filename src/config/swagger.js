'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecomus Professional E-Commerce API',
      version: '1.2.0',
      description: `
## Ecomus Professional REST API
A professional-grade e-commerce backend featuring:
- 🔐 **Auth**: JWT-based Secure Authentication (User/Admin roles)
- 📂 **Categories**: Dynamic Category management with professional CRUD
- 🛍️ **Products**: Multi-variant products with relational category mapping
- ☁️ **Images**: Cloudinary-powered image hosting and optimization
- 🛒 **Cart & Checkout**: Atomic stock-aware purchase flow via \`POST /buy\`
- 📜 **Audit Logs**: Comprehensive administrative action tracking
- 🔧 **Admin**: Full administrative control over system data
      `,
      contact: { name: 'Ecomus Dev Team' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'secret123' },
            role: { type: 'string', enum: ['USER', 'SELLER'], default: 'USER' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@admin.com' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        // ── Product ──────────────────────────────
        ProductCreateRequest: {
          type: 'object',
          required: ['name', 'categoryId', 'price', 'stock'],
          properties: {
            name: { type: 'string', example: 'Sony Wireless Headphones' },
            description: { type: 'string', example: 'High quality noise-canceling' },
            categoryId: { type: 'string', example: '60d5ec49f1b2c8a1234567ab' },
            brand: { type: 'string', example: 'Sony' },
            price: { type: 'number', example: 299.99 },
            stock: { type: 'integer', example: 15 },
            variants: { type: 'array', items: { $ref: '#/components/schemas/Variant' } },
            images: { type: 'array', items: { $ref: '#/components/schemas/File' } }
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            categoryId: { type: 'string' },
            category: { type: 'object', properties: { name: { type: 'string' } } },
            brand: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' },
            orderCount: { type: 'integer' },
            variants: { type: 'array', items: { $ref: '#/components/schemas/Variant' } },
            images: { type: 'array', items: { $ref: '#/components/schemas/File' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Category ─────────────────────────────
        CategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Electronics' },
            description: { type: 'string', example: 'Gadgets, appliances, and more' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Order ────────────────────────────────
        BuyRequest: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', example: '60d5ec49f1b2c8a1234567ab' },
            variantId: { type: 'string', example: '60d5ec49f1b2c8a1234567cd' },
            quantity: { type: 'integer', minimum: 1, example: 1 },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            total: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            variantId: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number' },
          },
        },
        // ── Variant & File ───────────────────────
        Variant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            color: { type: 'string' },
            size: { type: 'string' },
            sku: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' },
          },
        },
        File: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            format: { type: 'string' },
            size: { type: 'integer' },
          },
        },
        // ── Common ───────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    tags: [
      { name: 'Categories', description: 'Dynamic categorization' },
      { name: 'Products', description: 'Inventory management' },
      { name: 'Orders', description: 'Transaction processing' },
      { name: 'Auth', description: 'Identity management' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);