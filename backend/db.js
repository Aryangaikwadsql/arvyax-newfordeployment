import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error']
});

if (process.env.VERCEL_ENV !== 'production') globalForPrisma.prisma = prisma;
