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
  // P1001/P1017 = unreachable DB; P2021 = missing table (schema not pushed yet)
  return (
    code.startsWith('P1') ||
    code === 'P2021' ||
    msg.includes("can't reach database") ||
    msg.includes('connect') ||
    msg.includes('econnrefused') ||
    msg.includes('environment variable not found') ||
    msg.includes('does not exist')
  );
}

export function databaseErrorMessage(err) {
  const code = err?.code || '';
  const msg = (err?.message || '').toLowerCase();
  if (code === 'P2021' || msg.includes('does not exist')) {
    return 'Database tables are missing. Redeploy so Prisma can create them (build runs prisma db push).';
  }
  if (!process.env.DATABASE_URL) {
    return 'Database connection failed. Ensure DATABASE_URL is set on Vercel (use Supabase pooler URL with ?pgbouncer=true).';
  }
  return 'Database connection failed. Check DATABASE_URL on Vercel (Supabase pooler URL, port 6543, ?pgbouncer=true).';
}
