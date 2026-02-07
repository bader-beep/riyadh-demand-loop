import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { logger } from '@/src/lib/logger';
import { getOpenStatus } from '@/src/lib/openNow';
import { computeTrendingScore } from '@/src/lib/algorithms';
import {
  categoryToDb,
  categoryToApi,
  crowdToApi,
  waitBandToApi,
  confidenceToApi,
  parkingEaseToDb,
  PARKING_EASE_ORDER,
  WAIT_BAND_SCORES,
} from '@/src/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const category = url.searchParams.get('category');
    const district = url.searchParams.get('district');
    const openNow = url.searchParams.get('openNow');
    const kids = url.searchParams.get('kids');
    const stroller = url.searchParams.get('stroller');
    const prayerRoom = url.searchParams.get('prayerRoom');
    const parkingEaseMin = url.searchParams.get('parkingEaseMin');
    const timeWindowMin = parseInt(url.searchParams.get('timeWindowMin') || '120', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Record<string, unknown> = { is_active: true };

    if (category) where.category = categoryToDb(category);
    if (district) where.district = district;
    if (kids === 'true') where.kids_friendly = true;
    if (stroller === 'true') where.stroller_friendly = true;
    if (prayerRoom === 'true') where.prayer_room = true;

    if (parkingEaseMin) {
      const minOrder = PARKING_EASE_ORDER[parkingEaseToDb(parkingEaseMin)];
      if (minOrder) {
        const allowedParkingValues = Object.entries(PARKING_EASE_ORDER)
          .filter(([, order]) => order <= minOrder)
          .map(([key]) => key);
        where.parking_ease = { in: allowedParkingValues };
      }
    }

    const places = await prisma.place.findMany({
      where: where as any,
      include: { prediction: true },
    });

    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMin * 60000);

    // Compute trending score for each place
    const placesWithScores = await Promise.all(
      places.map(async (p) => {
        const signals = await prisma.signal.findMany({
          where: {
            place_id: p.id,
            created_at: { gte: windowStart },
          },
        });

        const trendingScore = computeTrendingScore(signals, now);
        const status = getOpenStatus(p.hours_json);
        const prediction = p.prediction;

        let bestTime: { start: string; end: string } | null = null;
        if (prediction) {
          try {
            const windows = JSON.parse(prediction.best_windows_json);
            if (windows.length > 0) {
              bestTime = { start: windows[0].start, end: windows[0].end };
            }
          } catch { /* ignore */ }
        }

        return {
          place: p,
          prediction,
          status,
          trendingScore,
          bestTime,
        };
      })
    );

    // Apply openNow filter
    let filtered = placesWithScores;
    if (openNow === 'true') {
      filtered = filtered.filter((r) => r.status.openNow === true);
    } else if (openNow === 'false') {
      filtered = filtered.filter((r) => r.status.openNow === false);
    }

    // Sort by trending score desc, then confidence desc, then lower wait band
    const CONFIDENCE_ORDER: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    filtered.sort((a, b) => {
      // 1) TrendingScore desc
      if (b.trendingScore !== a.trendingScore) return b.trendingScore - a.trendingScore;

      // 2) Higher confidence
      const confA = CONFIDENCE_ORDER[a.prediction?.confidence || 'LOW'] || 0;
      const confB = CONFIDENCE_ORDER[b.prediction?.confidence || 'LOW'] || 0;
      if (confB !== confA) return confB - confA;

      // 3) Lower wait band
      const waitA = WAIT_BAND_SCORES[a.prediction?.now_wait_band || '10-20'] || 2;
      const waitB = WAIT_BAND_SCORES[b.prediction?.now_wait_band || '10-20'] || 2;
      return waitA - waitB;
    });

    // Apply offset and limit
    const paged = filtered.slice(offset, offset + limit);

    const items = paged.map((r, index) => ({
      rank: offset + index + 1,
      place: {
        id: r.place.id,
        nameAr: r.place.name_ar,
        category: categoryToApi(r.place.category),
        district: r.place.district,
      },
      demand: {
        crowdLevel: r.prediction ? crowdToApi(r.prediction.now_crowd_level) : 'medium',
        waitBand: r.prediction ? waitBandToApi(r.prediction.now_wait_band) : '10-20',
        confidence: r.prediction ? confidenceToApi(r.prediction.confidence) : 'low',
        lastUpdated: r.prediction?.generated_at?.toISOString().replace(/\.\d{3}Z$/, 'Z') || now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      },
      bestTime: r.bestTime,
    }));

    const response = NextResponse.json({
      generatedAt: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      items,
    });
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
    return response;
  } catch (err) {
    logger.error('GET /api/trending error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: {} } },
      { status: 500 }
    );
  }
}
