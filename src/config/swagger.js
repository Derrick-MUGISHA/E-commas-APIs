'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecomus E-Commerce API',
      version: '1.0.0',
      description: `
## Ecomus E-Commerce REST API

A full-featured e-commerce API supporting:
- 🔐 **Auth**: Register, Login with JWT
- 🛍️ **Products**: Browse, search, filter by category/brand
- 🛒 **Cart**: Add/update/remove items (authenticated)
- 📦 **Orders**: Place & track orders (authenticated)
- 💬 **Comments**: Review products, react with likes/dislikes
- 🔧 **Admin**: Full product/variant/order management + seeding

### Authentication
Use the **Authorize** button and enter: \`Bearer <your_jwt_token>\`
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
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'secret123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // ── User ─────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'SELLER'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Product ──────────────────────────────
        ProductCreateRequest: {
          type: 'object',
          required: ['name', 'category'],
          properties: {
            name: { type: 'string', example: 'Nike Air Max 270' },
            description: { type: 'string', example: 'Comfortable running shoes' },
            category: { type: 'string', enum: ['ELECTRONICS', 'FASHION', 'HOME', 'BEAUTY', 'SPORTS'] },
            brand: { type: 'string', example: 'Nike' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            brand: { type: 'string' },
            variants: { type: 'array', items: { $ref: '#/components/schemas/Variant' } },
            images: { type: 'array', items: { $ref: '#/components/schemas/File' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Variant ──────────────────────────────
        VariantCreateRequest: {
          type: 'object',
          required: ['color', 'sku', 'price', 'stock'],
          properties: {
            color: { type: 'string', example: 'Red' },
            size: { type: 'string', example: 'M' },
            sku: { type: 'string', example: 'NIKE-AM270-RED-M' },
            price: { type: 'number', example: 129.99 },
            stock: { type: 'integer', example: 50 },
          },
        },
        Variant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            color: { type: 'string' },
            size: { type: 'string' },
            sku: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' },
            productId: { type: 'string' },
          },
        },
        // ── Cart ─────────────────────────────────
        CartItemRequest: {
          type: 'object',
          required: ['variantId', 'quantity'],
          properties: {
            variantId: { type: 'string', example: '60d5ec49f1b2c8a1234567ab' },
            quantity: { type: 'integer', minimum: 1, example: 2 },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  variant: { $ref: '#/components/schemas/Variant' },
                  quantity: { type: 'integer' },
                  subtotal: { type: 'number' },
                },
              },
            },
            total: { type: 'number' },
            itemCount: { type: 'integer' },
          },
        },
        // ── Order ────────────────────────────────
        PlaceOrderRequest: {
          type: 'object',
          properties: {
            note: { type: 'string', example: 'Please deliver before 6pm' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            total: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  variantId: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Comment ──────────────────────────────
        CommentCreateRequest: {
          type: 'object',
          required: ['content', 'productId'],
          properties: {
            content: { type: 'string', example: 'Great product!' },
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            productId: { type: 'string' },
            parentId: { type: 'string', description: 'Reply to another comment' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            rating: { type: 'integer' },
            userId: { type: 'string' },
            productId: { type: 'string' },
            parentId: { type: 'string' },
            replies: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── File ─────────────────────────────────
        File: {
          type: 'object',
          properties: {
            id: { type: 'string' },
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
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Register & login' },
      { name: 'Products', description: 'Browse and search products (public)' },
      { name: 'Variants', description: 'Product variants management' },
      { name: 'Cart', description: 'Shopping cart (authenticated)' },
      { name: 'Orders', description: 'Place and track orders (authenticated)' },
      { name: 'Comments', description: 'Product reviews and reactions' },
      { name: 'Admin', description: 'Admin-only: manage products, orders, seed data' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);