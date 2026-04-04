'use strict';
require('dotenv').config();

// Global Diagnostic Handlers (Catch silent crashes)
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💣 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('📡 Starting E-comus Server...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT (Masked)' : 'NOT FOUND');

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const productPublicRoutes = require('./src/routes/product.public.routes');
const productAdminRoutes = require('./src/routes/product.admin.routes');
const variantRoutes = require('./src/routes/Variant.routes');
const cartRoutes = require('./src/routes/cart.routes');
const orderRoutes = require('./src/routes/order.routes');
const commentRoutes = require('./src/routes/comment.routes');
const categoryRoutes = require('./src/routes/category.routes');

const { errorHandler } = require('./src/middleware/error.middleware');

const app = express();

// Security & parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-comus API Docs',
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  uptime: process.uptime(),
  timestamp: new Date() 
}));

// Routes
app.use('/api/auth/users', authRoutes);
app.use('/api/public/products', productPublicRoutes);
app.use('/api/admin/products', productAdminRoutes);
app.use('/api/public/products', variantRoutes);
app.use('/api/auth/cart', cartRoutes);
app.use('/api/auth/orders', orderRoutes);
app.use('/api/public/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

try {
  const server = app.listen(PORT, () => {
    console.log(`🚀 E-comus API running on port ${PORT}`);
    console.log(`📖 Swagger docs: http://localhost:${PORT}/api-docs`);
    
    // Heartbeat to ensure process stays alive in Gemini terminal tool
    setInterval(() => {
      // console.log('💓 Heartbeat (Stable)');
    }, 10000);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error('🛑 Port 3000 is already in use. Try killing the other process.');
      process.exit(1);
    } else {
      console.error('🛑 Server Error:', e.message);
    }
  });

} catch (err) {
  console.error('💥 Initial Startup Fail:', err.message);
  process.exit(1);
}

module.exports = app;