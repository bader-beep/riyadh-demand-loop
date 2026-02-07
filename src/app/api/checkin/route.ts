import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { logger } from '@/src/lib/logger';
import { checkRateLimit } from '@/src/lib/rateLimit';
import { recomputePredictions } from '@/src/lib/recompute';
import {
  crowdToApi,
  waitBandToApi,
  confidenceToApi,
  CROWD_SCORES,
  WAIT_BAND_SCORES,
} from '@/src/lib/constants';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const VALID_CROWD_LEVELS = ['low', 'medium', 'high'];
const VALID_WAIT_BANDS = ['0-10', '10-20', '20-40', '40+'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId, crowdLevel, waitBand } = body;

    // Validation
    if (!placeId || !crowdLevel || !waitBand) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'placeId, crowdLevel, and waitBand are required',
            details: {},
          },
        },
        { status: 400 }
      );
    }

    if (!VALID_CROWD_LEVELS.includes(crowdLevel)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `crowdLevel must be one of: ${VALID_CROWD_LEVELS.join(', ')}`,
            details: {},
          },
        },
        { status: 400 }
      );
    }

    if (!VALID_WAIT_BANDS.includes(waitBand)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `waitBand must be one of: ${VALID_WAIT_BANDS.join(', ')}`,
            details: {},
          },
        },
        { status: 400 }
      );
    }

    // Check place exists
    const place = await prisma.place.findUnique({ where: { id: placeId } });
    if (!place) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Place not found',
            details: {},
          },
        },
        { status: 400 }
      );
    }

    // Rate limiting: user_hash from header or fallback to IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || '127.0.0.1';
    const userHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

    if (!checkRateLimit(userHash)) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many check-ins. Maximum 6 per 10 minutes.',
            details: {},
          },
        },
        { status: 429 }
      );
    }

    // Create signal
    await prisma.signal.create({
      data: {
        place_id: placeId,
        type: 'CHECKIN',
        crowd_level: crowdLevel.toUpperCase(),
        wait_band: waitBand,
        user_hash: userHash,
        weight: 1.0,
      },
    });

    logger.info(`Check-in: place=${placeId} crowd=${crowdLevel} wait=${waitBand}`);

    // Trigger recompute for this place
    await recomputePredictions(prisma, [placeId]);

    // Get updated prediction
    const prediction = await prisma.prediction.findUnique({
      where: { place_id: placeId },
    });

    return NextResponse.json(
      {
        ok: true,
        updated: {
          placeId,
          now: {
            crowdLevel: prediction ? crowdToApi(prediction.now_crowd_level) : crowdLevel,
            waitBand: prediction ? waitBandToApi(prediction.now_wait_band) : waitBand,
            confidence: prediction ? confidenceToApi(prediction.confidence) : 'low',
            confidenceScore: prediction ? prediction.confidence_score : 0,
            lastUpdated: prediction?.generated_at?.toISOString().replace(/\.\d{3}Z$/, 'Z') || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error('POST /api/checkin error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: {} } },
      { status: 500 }
    );
  }
}
