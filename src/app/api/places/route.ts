import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { logger } from '@/src/lib/logger';
import { getOpenStatus } from '@/src/lib/openNow';
import { haversineKm, boundingBox } from '@/src/lib/geo';
import {
  categoryToDb,
  categoryToApi,
  crowdToApi,
  waitBandToApi,
  confidenceToApi,
  parkingEaseToApi,
  parkingEaseToDb,
  PARKING_EASE_ORDER,
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
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radiusKm = parseFloat(url.searchParams.get('radiusKm') || '6');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Record<string, unknown> = { is_active: true };

    if (category) {
      where.category = categoryToDb(category);
    }
    if (district) {
      where.district = district;
    }
    if (kids === 'true') {
      where.kids_friendly = true;
    }
    if (stroller === 'true') {
      where.stroller_friendly = true;
    }
    if (prayerRoom === 'true') {
      where.prayer_room = true;
    }

    // Geo bounding box prefilter
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const bb = boundingBox(latNum, lngNum, radiusKm);
      where.lat = { gte: bb.minLat, lte: bb.maxLat };
      where.lng = { gte: bb.minLng, lte: bb.maxLng };
    }

    // Parking ease filter
    if (parkingEaseMin) {
      const minOrder = PARKING_EASE_ORDER[parkingEaseToDb(parkingEaseMin)];
      if (minOrder) {
        // EASY=1, MEDIUM=2, HARD=3. Filter for parking ease <= minOrder (easier or equal)
        const allowedParkingValues = Object.entries(PARKING_EASE_ORDER)
          .filter(([, order]) => order <= minOrder)
          .map(([key]) => key);
        where.parking_ease = { in: allowedParkingValues };
      }
    }

    const places = await prisma.place.findMany({
      where: where as any,
      include: { prediction: true },
      take: limit + offset + 200, // Fetch extra for post-filtering
    });

    let results = places.map((p) => {
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
        id: p.id,
        nameAr: p.name_ar,
        nameEn: p.name_en,
        category: categoryToApi(p.category),
        district: p.district,
        lat: p.lat,
        lng: p.lng,
        family: {
          kids: p.kids_friendly,
          stroller: p.stroller_friendly,
          prayerRoom: p.prayer_room,
          parkingEase: parkingEaseToApi(p.parking_ease),
        },
        status: {
          openNow: status.openNow,
          hoursKnown: status.hoursKnown,
        },
        demand: {
          crowdLevel: prediction ? crowdToApi(prediction.now_crowd_level) : 'medium',
          waitBand: prediction ? waitBandToApi(prediction.now_wait_band) : '10-20',
          confidence: prediction ? confidenceToApi(prediction.confidence) : 'low',
          lastUpdated: prediction?.generated_at?.toISOString().replace(/\.\d{3}Z$/, 'Z') || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        },
        bestTime,
        _lat: p.lat,
        _lng: p.lng,
        _hoursKnown: status.hoursKnown,
        _openNow: status.openNow,
      };
    });

    // Open now filter (excludes unknown hours by default)
    if (openNow === 'true') {
      results = results.filter((r) => r._openNow === true);
    } else if (openNow === 'false') {
      results = results.filter((r) => r._openNow === false);
    }

    // Geo distance post-filter (Haversine)
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      results = results.filter((r) => {
        const dist = haversineKm(latNum, lngNum, r._lat, r._lng);
        return dist <= radiusKm;
      });
    }

    // Apply offset and limit
    const paged = results.slice(offset, offset + limit);

    // Strip internal fields
    const output = paged.map(({ _lat, _lng, _hoursKnown, _openNow, ...rest }) => rest);

    const response = NextResponse.json({ places: output });
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
    return response;
  } catch (err) {
    logger.error('GET /api/places error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: {} } },
      { status: 500 }
    );
  }
}
