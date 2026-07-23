import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/prisma';

export async function GET() {
  const db = await checkDatabaseConnection();
  const hasJwt = !!process.env.JWT_SECRET;
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  const healthy = db.ok && hasJwt && hasDbUrl;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks: {
        database: db.ok ? 'connected' : 'failed',
        database_error: db.ok ? null : db.message,
        DATABASE_URL_set: hasDbUrl,
        JWT_SECRET_set: hasJwt,
        OPENROUTER_API_KEY_set: hasOpenRouter,
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
