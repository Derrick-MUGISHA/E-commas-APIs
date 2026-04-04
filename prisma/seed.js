const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🚮 Clearing existing data...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.log.deleteMany({});

  console.log('👥 Creating default users...');
  
  const adminEmail = 'admin@admin.com';
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created default admin (admin@admin.com / admin123)');

  console.log('📂 Creating categories...');
  const categoryNames = ['ELECTRONICS', 'FASHION', 'HOME', 'BEAUTY', 'SPORTS'];
  const createdCategories = [];

  for (const name of categoryNames) {
    const cat = await prisma.category.create({
      data: { 
        name, 
        description: `Everything related to ${name.toLowerCase()}` 
      }
    });
    createdCategories.push(cat);
  }

  console.log('🛍️ Generating 50 template products...');
  const brands = ['Sony', 'Nike', 'Samsung', 'Loreal', 'Adidas', 'Ikea', 'Apple', 'LG', 'Puma'];

  for (let i = 1; i <= 50; i++) {
    const category = createdCategories[i % createdCategories.length];
    const brand = brands[i % brands.length];
    
    await prisma.product.create({
      data: {
        name: `Professional ${category.name} Item ${i}`,
        description: `High-quality ${brand} product in the ${category.name} category. Pro-grade e-commerce item with full audit logging support.`,
        categoryId: category.id,
        brand: brand,
        price: Math.floor(Math.random() * 500) + 10,
        stock: Math.floor(Math.random() * 100) + 1,
        variants: [
          { 
            id: require('uuid').v4(),
            color: 'Midnight Black', 
            size: 'Standard', 
            sku: `${brand.substring(0, 3).toUpperCase()}-${i}-BLK`, 
            price: Math.floor(Math.random() * 500) + 10,
            stock: 20
          }
        ],
        images: [
          { 
            url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 
            format: 'JPG', 
            size: 1024 
          }
        ],
        orderCount: 0
      }
    });
  }

  console.log('🚀 Successfully seeded 50 products linked to new Category models!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
