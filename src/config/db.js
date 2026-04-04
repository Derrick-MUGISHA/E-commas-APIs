const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

// Explicit connection test for diagnostics
prisma.$connect()
  .then(() => console.log('🟢 MongoDB Connection Successful (Prisma)'))
  .catch((err) => {
    console.error('🔴 MongoDB Connection Error:', err.message);
    process.exit(1);
  });

module.exports = prisma;