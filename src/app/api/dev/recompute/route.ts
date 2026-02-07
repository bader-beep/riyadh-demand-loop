import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { logger } from '@/src/lib/logger';
import { recomputePredictions } from '@/src/lib/recompute';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if enabled
    if (process.env.DEV_RECOMPUTE_ENABLED !== 'true') {
      return NextResponse.json(
        {
          error: {
            code: 'DEV_ONLY_ENDPOINT',
            message: 'This endpoint is disabled',
            details: {},
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const placeIds: string[] | undefined = body.placeIds;

    const recomputed = await recomputePredictions(prisma, placeIds);

    return NextResponse.json({ ok: true, recomputed });
  } catch (err) {
    logger.error('POST /api/dev/recompute error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: {} } },
      { status: 500 }
    );
  }
}
