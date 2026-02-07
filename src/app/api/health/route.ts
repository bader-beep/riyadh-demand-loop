import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const placesCount = await prisma.place.count({ where: { is_active: true } });
    return NextResponse.json({ ok: true, db: true, placesCount });
  } catch (err) {
    logger.error('Health check failed', err);
    return NextResponse.json({ ok: false, db: false, placesCount: 0 }, { status: 500 });
  }
}
