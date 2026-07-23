import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message || 'Database connection failed' };
  }
}

export function isDatabaseError(err) {
  const code = err?.code || '';
  const msg = (err?.message || '').toLowerCase();
  return (
    code.startsWith('P1') ||
    msg.includes("can't reach database") ||
    msg.includes('connect') ||
    msg.includes('database') ||
    msg.includes('econnrefused') ||
    msg.includes('environment variable not found')
  );
}
