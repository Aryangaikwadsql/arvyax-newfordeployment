const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['warn', 'error']
});

if (process.env.VERCEL_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
