'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function main() {
  console.log('📡 Starting Secure Seeding Process...');

  // 1. Load Admin Credentials from Environment
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@admin.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  
  if (!process.env.SEED_ADMIN_EMAIL) {
    console.warn('⚠️  SEED_ADMIN_EMAIL not set in .env. Using default.');
  }

  console.log('🚮 Clearing existing core data...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  // Log preservation depends on audit requirements, clearing for seed purity:
  await prisma.log.deleteMany({});

  console.log('👥 Synchronizing Admin Account...');
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedAdminPassword },
    create: {
      email: adminEmail,
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin account synchronized: ${adminEmail}`);

  // 2. Load Categories from External JSON
  const categoriesPath = path.join(__dirname, 'data', 'categories.json');
  if (!fs.existsSync(categoriesPath)) {
    throw new Error(`🛑 Categories data file not found at: ${categoriesPath}`);
  }

  const categoryData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  console.log(`📂 Seeding ${categoryData.length} professional categories...`);

  const createdCategories = [];
  for (const cat of categoryData) {
    const createdCat = await prisma.category.create({
      data: {
        name: cat.name,
        description: cat.description
      }
    });
    createdCategories.push(createdCat);
  }
  console.log(`✅ Categorization complete.`);

  // 3. Generate 50 Template Products (Distributed across 50 categories)
  console.log('🛍️ Generating 50 high-quality products...');
  const brands = ['Sony', 'Nike', 'Samsung', 'Loreal', 'Adidas', 'Ikea', 'Apple', 'LG', 'Puma', 'Honda', 'Toyota'];

  for (let i = 0; i < 50; i++) {
    // Map each product to exactly one of the 50 categories sequentially
    const category = createdCategories[i % createdCategories.length];
    const brand = brands[i % brands.length];
    const productName = `Professional ${category.name} ${brand} Model ${i + 1}`;
    
    await prisma.product.create({
      data: {
        name: productName,
        description: `Premium ${brand} solution within the ${category.name} landscape. Engineered for production-scale e-commerce audits.`,
        categoryId: category.id,
        brand: brand,
        price: Number((Math.random() * (1000 - 10) + 10).toFixed(2)),
        stock: Math.floor(Math.random() * 200) + 50,
        variants: [
          {
            id: uuidv4(),
            color: 'Professional Edition',
            size: 'Standard',
            sku: `PRO-${brand.substring(0, 3).toUpperCase()}-${i + 100}`,
            price: Number((Math.random() * (1000 - 10) + 10).toFixed(2)),
            stock: 25
          }
        ],
        images: [
          {
            url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
            format: 'JPG',
            size: 2048
          }
        ],
        orderCount: 0
      }
    });
  }

  console.log('🚀 Seeding finished successfully!');
  console.log(`📊 Summary:\n- 1 Admin\n- ${createdCategories.length} Categories\n- 50 Products`);
}

main()
  .catch((e) => {
    console.error('💥 Seeding failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
